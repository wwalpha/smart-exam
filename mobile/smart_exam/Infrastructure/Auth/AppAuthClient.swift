import AppAuth
import Foundation
import os
import UIKit

@MainActor
final class AppAuthClient {
    private let configProvider: any OIDCConfigProviding
    private let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "smart_exam", category: "AppAuthClient")
    private var currentAuthorizationFlow: OIDExternalUserAgentSession?

    init(configProvider: any OIDCConfigProviding) {
        self.configProvider = configProvider
    }

    func signIn(username: String, password: String) async throws -> AuthSession {
        let config = try configProvider.configuration
        logInfo("Cognito direct sign-in start. clientID=\(config.clientID)")

        let response = try await requestCognitoAuth(
            endpoint: config.identityProviderEndpoint,
            body: CognitoAPIInitiateAuthRequest(
                authFlow: "USER_PASSWORD_AUTH",
                clientId: config.clientID,
                authParameters: [
                    "USERNAME": username.trimmingCharacters(in: .whitespacesAndNewlines),
                    "PASSWORD": password
                ]
            )
        )

        guard let result = response.authenticationResult else {
            throw AppAuthClientError.unsupportedChallenge(response.challengeName ?? "unknown")
        }

        logInfo("Cognito direct sign-in succeeded")
        return AuthSession(
            accessToken: result.accessToken,
            idToken: result.idToken,
            refreshToken: result.refreshToken,
            expiresAt: Date().addingTimeInterval(TimeInterval(result.expiresIn)),
            tokenType: result.tokenType
        )
    }

    func refresh(session: AuthSession) async throws -> AuthSession? {
        guard let refreshToken = session.refreshToken, !refreshToken.isEmpty else {
            return nil
        }

        let config = try configProvider.configuration
        let response = try await requestCognitoAuth(
            endpoint: config.identityProviderEndpoint,
            body: CognitoAPIInitiateAuthRequest(
                authFlow: "REFRESH_TOKEN_AUTH",
                clientId: config.clientID,
                authParameters: [
                    "REFRESH_TOKEN": refreshToken
                ]
            )
        )

        guard let result = response.authenticationResult else {
            throw AppAuthClientError.unsupportedChallenge(response.challengeName ?? "unknown")
        }

        return AuthSession(
            accessToken: result.accessToken,
            idToken: result.idToken ?? session.idToken,
            refreshToken: result.refreshToken ?? refreshToken,
            expiresAt: Date().addingTimeInterval(TimeInterval(result.expiresIn)),
            tokenType: result.tokenType
        )
    }

    func resumeExternalUserAgentFlow(with url: URL) -> Bool {
        guard let flow = currentAuthorizationFlow else {
            return false
        }

        if flow.resumeExternalUserAgentFlow(with: url) {
            currentAuthorizationFlow = nil
            return true
        }

        return false
    }

    private func requestCognitoAuth(
        endpoint: URL,
        body: CognitoAPIInitiateAuthRequest
    ) async throws -> CognitoAPIInitiateAuthResponse {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/x-amz-json-1.1", forHTTPHeaderField: "Content-Type")
        request.setValue("AWSCognitoIdentityProviderService.InitiateAuth", forHTTPHeaderField: "X-Amz-Target")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AppAuthClientError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            let errorResponse = try? JSONDecoder().decode(CognitoAPIErrorResponse.self, from: data)
            throw AppAuthClientError.service(
                statusCode: httpResponse.statusCode,
                type: errorResponse?.type,
                message: errorResponse?.message ?? String(decoding: data, as: UTF8.self)
            )
        }

        return try JSONDecoder().decode(CognitoAPIInitiateAuthResponse.self, from: data)
    }

    private func logInfo(_ message: String) {
        logger.info("\(message, privacy: .public)")
        print("[AppAuthClient] \(message)")
    }
}

private struct CognitoAPIInitiateAuthRequest: Encodable {
    let authFlow: String
    let clientId: String
    let authParameters: [String: String]

    enum CodingKeys: String, CodingKey {
        case authFlow = "AuthFlow"
        case clientId = "ClientId"
        case authParameters = "AuthParameters"
    }
}

private struct CognitoAPIInitiateAuthResponse: Decodable {
    let authenticationResult: AuthenticationResult?
    let challengeName: String?

    enum CodingKeys: String, CodingKey {
        case authenticationResult = "AuthenticationResult"
        case challengeName = "ChallengeName"
    }

    struct AuthenticationResult: Decodable {
        let accessToken: String
        let idToken: String?
        let refreshToken: String?
        let expiresIn: Int
        let tokenType: String

        enum CodingKeys: String, CodingKey {
            case accessToken = "AccessToken"
            case idToken = "IdToken"
            case refreshToken = "RefreshToken"
            case expiresIn = "ExpiresIn"
            case tokenType = "TokenType"
        }
    }
}

private struct CognitoAPIErrorResponse: Decodable {
    let type: String?
    let message: String?

    enum CodingKeys: String, CodingKey {
        case type = "__type"
        case message
    }
}

enum AppAuthClientError: LocalizedError {
    case invalidResponse
    case unsupportedChallenge(String)
    case service(statusCode: Int, type: String?, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Cognito 認証APIのレスポンスが不正です"
        case .unsupportedChallenge(let challenge):
            return "追加認証チャレンジ \(challenge) はまだ画面内ログインで未対応です"
        case .service(let statusCode, let type, let message):
            let serviceType = type.map { " \($0)" } ?? ""
            return "Cognito 認証APIエラー \(statusCode)\(serviceType): \(message)"
        }
    }
}
