import Alamofire
import Foundation
import os

final class CognitoRequestInterceptor: RequestInterceptor, @unchecked Sendable {
    typealias AccessTokenProvider = @MainActor @Sendable () async throws -> String
    typealias AuthorizationFailureHandler = @MainActor @Sendable () -> Void

    static let requiresAuthorizationHeader = "X-Requires-Authorization"
    private static let requiresAuthorizationProperty = "smart_exam.requiresAuthorization"
    private static let logger = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "smart_exam",
        category: "CognitoRequestInterceptor"
    )

    private let accessTokenProvider: AccessTokenProvider
    private let refreshAccessTokenProvider: AccessTokenProvider
    private let authorizationFailureHandler: AuthorizationFailureHandler?
    private let retryState = CognitoRetryState()
    private let refreshCoordinator = CognitoRefreshCoordinator()

    init(
        accessTokenProvider: @escaping AccessTokenProvider,
        refreshAccessTokenProvider: @escaping AccessTokenProvider,
        authorizationFailureHandler: AuthorizationFailureHandler? = nil
    ) {
        self.accessTokenProvider = accessTokenProvider
        self.refreshAccessTokenProvider = refreshAccessTokenProvider
        self.authorizationFailureHandler = authorizationFailureHandler
    }

    func adapt(
        _ urlRequest: URLRequest,
        for session: Session,
        completion: @escaping @Sendable (Result<URLRequest, any Error>) -> Void
    ) {
        adapt(urlRequest, requestID: nil, completion: completion)
    }

    func adapt(
        _ urlRequest: URLRequest,
        using state: RequestAdapterState,
        completion: @escaping @Sendable (Result<URLRequest, any Error>) -> Void
    ) {
        adapt(urlRequest, requestID: state.requestID, completion: completion)
    }

    private func adapt(
        _ urlRequest: URLRequest,
        requestID: UUID?,
        completion: @escaping @Sendable (Result<URLRequest, any Error>) -> Void
    ) {
        let requiresAuthorization = Self.requiresAuthorization(urlRequest)
        var adaptedRequest = urlRequest
        adaptedRequest.setValue(nil, forHTTPHeaderField: Self.requiresAuthorizationHeader)

        guard requiresAuthorization else {
            log("adapt public request method=\(Self.method(from: adaptedRequest)) url=\(Self.url(from: adaptedRequest))")
            completion(.success(adaptedRequest))
            return
        }

        if let requestID {
            retryState.markRequiresAuthorization(for: requestID)
        }
        adaptedRequest = Self.setRequiresAuthorizationProperty(on: adaptedRequest)

        Task { @MainActor in
            do {
                let accessToken = try await accessTokenProvider()
                adaptedRequest.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
                self.log(
                    "adapt authorized request method=\(Self.method(from: adaptedRequest)) url=\(Self.url(from: adaptedRequest)) tokenLength=\(accessToken.count) claims=\(Self.jwtDebugSummary(accessToken))"
                )
                completion(.success(adaptedRequest))
            } catch {
                self.log(
                    "adapt failed method=\(Self.method(from: adaptedRequest)) url=\(Self.url(from: adaptedRequest)) error=\(error)"
                )
                completion(.failure(error))
            }
        }
    }

    func retry(
        _ request: Request,
        for session: Session,
        dueTo error: any Error,
        completion: @escaping @Sendable (RetryResult) -> Void
    ) {
        guard request.response?.statusCode == 401 else {
            completion(.doNotRetry)
            return
        }

        let requestURL = request.request?.url?.absoluteString ?? "unknown"
        log("retry received 401 url=\(requestURL) retryCount=\(request.retryCount)")

        let isAuthorizedRequest = retryState.requiresAuthorization(request.id) || request.requests.contains(where: Self.requiresAuthorization)
        guard isAuthorizedRequest else {
            log("retry skipped because request is not marked as authorized url=\(requestURL)")
            completion(.doNotRetry)
            return
        }

        guard request.retryCount < 1 else {
            log("retry skipped because retryCount limit reached url=\(requestURL)")
            notifyAuthorizationFailure()
            completion(.doNotRetry)
            return
        }

        guard retryState.markRefreshAttemptIfNeeded(for: request.id) else {
            log("retry skipped because refresh was already attempted url=\(requestURL)")
            completion(.doNotRetry)
            return
        }

        Task { @MainActor in
            do {
                if let failedToken = Self.bearerToken(from: request),
                   let currentToken = try? await accessTokenProvider(),
                   !currentToken.isEmpty,
                   currentToken != failedToken {
                    self.log("retry using already refreshed token url=\(requestURL)")
                    completion(.retry)
                    return
                }

                let refreshedToken = try await refreshCoordinator.refresh(using: refreshAccessTokenProvider)
                self.log("retry refresh succeeded url=\(requestURL) tokenLength=\(refreshedToken.count)")
                completion(.retry)
            } catch {
                self.log("retry refresh failed url=\(requestURL) error=\(error)")
                completion(.doNotRetryWithError(error))
            }
        }
    }

    private static func requiresAuthorization(_ request: URLRequest) -> Bool {
        if let requiresAuthorization = URLProtocol.property(
            forKey: requiresAuthorizationProperty,
            in: request
        ) as? Bool {
            return requiresAuthorization
        }

        return request.value(forHTTPHeaderField: requiresAuthorizationHeader) == "true"
    }

    private static func bearerToken(from request: Request) -> String? {
        request.requests.reversed().compactMap(bearerToken(from:)).first
    }

    private static func bearerToken(from request: URLRequest) -> String? {
        guard let authorization = request.value(forHTTPHeaderField: "Authorization") else {
            return nil
        }

        let prefix = "Bearer "
        guard authorization.hasPrefix(prefix) else {
            return nil
        }

        return String(authorization.dropFirst(prefix.count))
    }

    private static func setRequiresAuthorizationProperty(on request: URLRequest) -> URLRequest {
        guard let mutableRequest = (request as NSURLRequest).mutableCopy() as? NSMutableURLRequest else {
            return request
        }

        URLProtocol.setProperty(true, forKey: requiresAuthorizationProperty, in: mutableRequest)
        return mutableRequest as URLRequest
    }

    private static func method(from request: URLRequest) -> String {
        request.httpMethod ?? "UNKNOWN"
    }

    private static func url(from request: URLRequest) -> String {
        request.url?.absoluteString ?? "unknown"
    }

    private static func jwtDebugSummary(_ token: String) -> String {
        guard let payload = jwtPayload(token) else {
            return "invalid-jwt"
        }

        let tokenUse = stringValue(payload["token_use"]) ?? "nil"
        let issuer = stringValue(payload["iss"]) ?? "nil"
        let audience = stringOrArrayValue(payload["aud"]) ?? "nil"
        let clientID = stringValue(payload["client_id"]) ?? "nil"
        let scope = stringValue(payload["scope"]) ?? "nil"
        let expiresAt = dateValue(payload["exp"]) ?? "nil"

        return "token_use=\(tokenUse), iss=\(issuer), aud=\(audience), client_id=\(clientID), scope=\(scope), exp=\(expiresAt)"
    }

    private static func jwtPayload(_ token: String) -> [String: Any]? {
        let parts = token.split(separator: ".")
        guard parts.count >= 2 else {
            return nil
        }

        var base64 = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        let padding = (4 - base64.count % 4) % 4
        base64 += String(repeating: "=", count: padding)

        guard
            let data = Data(base64Encoded: base64),
            let object = try? JSONSerialization.jsonObject(with: data),
            let payload = object as? [String: Any]
        else {
            return nil
        }

        return payload
    }

    private static func stringValue(_ value: Any?) -> String? {
        value as? String
    }

    private static func stringOrArrayValue(_ value: Any?) -> String? {
        if let string = value as? String {
            return string
        }

        if let array = value as? [String] {
            return array.joined(separator: ",")
        }

        return nil
    }

    private static func dateValue(_ value: Any?) -> String? {
        guard let timestamp = value as? TimeInterval else {
            return nil
        }

        return ISO8601DateFormatter().string(from: Date(timeIntervalSince1970: timestamp))
    }

    private func log(_ message: String) {
        Self.logger.debug("\(message, privacy: .public)")
        print("[CognitoRequestInterceptor] \(message)")
    }

    private func notifyAuthorizationFailure() {
        guard let authorizationFailureHandler else {
            return
        }

        Task { @MainActor in
            authorizationFailureHandler()
        }
    }
}

private final class CognitoRetryState: @unchecked Sendable {
    private let lock = NSLock()
    private var authorizedRequestIDs = Set<UUID>()
    private var refreshAttemptedRequestIDs = Set<UUID>()

    func markRequiresAuthorization(for requestID: UUID) {
        lock.lock()
        authorizedRequestIDs.insert(requestID)
        lock.unlock()
    }

    func requiresAuthorization(_ requestID: UUID) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        return authorizedRequestIDs.contains(requestID)
    }

    func markRefreshAttemptIfNeeded(for requestID: UUID) -> Bool {
        lock.lock()
        defer { lock.unlock() }

        guard !refreshAttemptedRequestIDs.contains(requestID) else {
            return false
        }

        refreshAttemptedRequestIDs.insert(requestID)
        return true
    }
}

private actor CognitoRefreshCoordinator {
    private var task: Task<String, Error>?

    func refresh(
        using refreshAccessTokenProvider: @escaping CognitoRequestInterceptor.AccessTokenProvider
    ) async throws -> String {
        if let task {
            return try await task.value
        }

        let task = Task { @MainActor in
            try await refreshAccessTokenProvider()
        }
        self.task = task

        do {
            let accessToken = try await task.value
            self.task = nil
            return accessToken
        } catch {
            self.task = nil
            throw error
        }
    }
}
