import Alamofire
import Foundation
import os

final class APIClient {
    private static let logger = Logger(
        subsystem: Bundle.main.bundleIdentifier ?? "smart_exam",
        category: "APIClient"
    )
    private static let maxLoggedBodyBytes = 4_096

    private let baseURL: URL?
    private let session: Session

    init(
        baseURL: URL? = URL(string: OIDCConfig.backendBaseURL),
        session: Session? = nil,
        urlSessionConfiguration: URLSessionConfiguration? = nil,
        accessTokenProvider: @escaping CognitoRequestInterceptor.AccessTokenProvider = { "" },
        refreshAccessTokenProvider: @escaping CognitoRequestInterceptor.AccessTokenProvider = { "" },
        authorizationFailureHandler: CognitoRequestInterceptor.AuthorizationFailureHandler? = nil
    ) {
        self.baseURL = baseURL

        if let session {
            self.session = session
        } else {
            let interceptor = CognitoRequestInterceptor(
                accessTokenProvider: accessTokenProvider,
                refreshAccessTokenProvider: refreshAccessTokenProvider,
                authorizationFailureHandler: authorizationFailureHandler
            )

            if let urlSessionConfiguration {
                self.session = Session(configuration: urlSessionConfiguration, interceptor: interceptor)
            } else {
                self.session = Session(interceptor: interceptor)
            }
        }
    }

    func postJSON<Request: Encodable, Response: Decodable>(
        path: String,
        body: Request,
        requiresAuthorization: Bool = false
    ) async throws -> Response {
        guard let baseURL else {
            throw APIClientError.missingBaseURL
        }

        var headers: HTTPHeaders = [.contentType("application/json")]
        if requiresAuthorization {
            headers.add(name: CognitoRequestInterceptor.requiresAuthorizationHeader, value: "true")
        }

        let response = await session.request(
            baseURL.appending(path: path),
            method: .post,
            parameters: body,
            encoder: JSONParameterEncoder.default,
            headers: headers
        )
        .validate()
        .serializingDecodable(Response.self)
        .response

        return try Self.value(from: response)
    }

    func getDecodable<Response: Decodable>(
        path: String,
        requiresAuthorization: Bool = false
    ) async throws -> Response {
        guard let baseURL else {
            throw APIClientError.missingBaseURL
        }

        var headers: HTTPHeaders = []
        if requiresAuthorization {
            headers.add(name: CognitoRequestInterceptor.requiresAuthorizationHeader, value: "true")
        }

        let response = await session.request(
            baseURL.appending(path: path),
            headers: headers
        )
        .validate()
        .serializingDecodable(Response.self)
        .response

        return try Self.value(from: response)
    }

    func getJSON(path: String, requiresAuthorization: Bool = false) async throws -> [String: Any] {
        guard let baseURL else {
            throw APIClientError.missingBaseURL
        }

        var headers: HTTPHeaders = []
        if requiresAuthorization {
            headers.add(name: CognitoRequestInterceptor.requiresAuthorizationHeader, value: "true")
        }

        let response = await session.request(
            baseURL.appending(path: path),
            headers: headers
        )
        .validate()
        .serializingData()
        .response

        let responseData = try Self.value(from: response)
        let object = try JSONSerialization.jsonObject(with: responseData, options: [])
        return object as? [String: Any] ?? ["raw": String(decoding: responseData, as: UTF8.self)]
    }

    private static func value<Value>(from response: DataResponse<Value, AFError>) throws -> Value {
        switch response.result {
        case .success(let value):
            return value
        case .failure(let error):
            logAPIError(response: response, error: error)
            throw error
        }
    }

    private static func logAPIError<Value>(response: DataResponse<Value, AFError>, error: AFError) {
        let method = response.request?.httpMethod ?? "UNKNOWN"
        let url = response.request?.url?.absoluteString ?? "unknown"
        let statusCode = response.response.map { String($0.statusCode) } ?? "none"
        let errorDescription = String(describing: error)
        let body = loggedBody(from: response.data)

        logger.error(
            "API error method=\(method, privacy: .public) url=\(url, privacy: .public) status=\(statusCode, privacy: .public) error=\(errorDescription, privacy: .public) body=\(body, privacy: .private)"
        )
        print(
            "[APIClient] API error method=\(method) url=\(url) status=\(statusCode) error=\(errorDescription) body=\(body)"
        )
    }

    private static func loggedBody(from data: Data?) -> String {
        guard let data, !data.isEmpty else {
            return "empty"
        }

        let prefix = data.prefix(maxLoggedBodyBytes)
        let body = String(decoding: prefix, as: UTF8.self)
        if data.count > maxLoggedBodyBytes {
            return "\(body)...(truncated \(data.count - maxLoggedBodyBytes) bytes)"
        }

        return body
    }
}

enum APIClientError: LocalizedError {
    case missingBaseURL

    var errorDescription: String? {
        switch self {
        case .missingBaseURL:
            return "OIDCConfig.backendBaseURL に backend API の URL を設定してください"
        }
    }
}
