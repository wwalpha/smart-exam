import Combine
import Foundation
import os
import UIKit
import AppAuth

@MainActor
final class AuthService: NSObject, ObservableObject {
    private static let authStateStorageKey = "cognitoAuthState"
    private static let tokenSessionStorageKey = "cognitoTokenSession"
    private let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "smart_exam", category: "AuthService")

    @Published var authState: OIDAuthState?
    @Published private var tokenSession: CognitoTokenSession?
    @Published var userInfo: [String: Any] = [:]
    @Published var backendResponse: [String: Any] = [:]
    @Published var errorMessage: String?
    @Published var statusMessage = "未認証"
    @Published var isSigningIn = false

    private var currentAuthorizationFlow: OIDExternalUserAgentSession?

    var isAuthenticated: Bool {
        tokenSession != nil || authState?.isAuthorized == true
    }

    override init() {
        super.init()
        loadStoredAuthentication()
    }

    func signIn(username: String, password: String) async {
        if let configurationError = OIDCConfig.configurationError {
            errorMessage = configurationError
            statusMessage = "認証設定エラー"
            isSigningIn = false
            return
        }

        guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            errorMessage = "メールアドレスを入力してください"
            statusMessage = "認証入力エラー"
            return
        }

        guard !password.isEmpty else {
            errorMessage = "パスワードを入力してください"
            statusMessage = "認証入力エラー"
            return
        }

        isSigningIn = true
        errorMessage = nil
        statusMessage = "Cognito へログイン中"
        logAuthInfo("Cognito direct sign-in start. clientID=\(OIDCConfig.clientID)")

        do {
            let response = try await requestCognitoAuth(
                body: CognitoInitiateAuthRequest(
                    authFlow: "USER_PASSWORD_AUTH",
                    clientId: OIDCConfig.clientID,
                    authParameters: [
                        "USERNAME": username.trimmingCharacters(in: .whitespacesAndNewlines),
                        "PASSWORD": password
                    ]
                )
            )

            guard let result = response.authenticationResult else {
                throw CognitoDirectAuthError.unsupportedChallenge(response.challengeName ?? "unknown")
            }

            setTokenSession(
                CognitoTokenSession(
                    accessToken: result.accessToken,
                    idToken: result.idToken,
                    refreshToken: result.refreshToken,
                    expiresAt: Date().addingTimeInterval(TimeInterval(result.expiresIn)),
                    tokenType: result.tokenType
                )
            )
            setAuthState(nil)
            statusMessage = "認証済み"
            errorMessage = nil
            logAuthInfo("Cognito direct sign-in succeeded")
        } catch {
            setTokenSession(nil)
            statusMessage = "認証失敗"
            errorMessage = "認証失敗: \(describeAuthError(error))"
            logAuthError("Direct authorization failed", error: error)
        }

        isSigningIn = false
    }

    func discoverAndSignIn() {
        if let configurationError = OIDCConfig.configurationError {
            errorMessage = configurationError
            statusMessage = "認証設定エラー"
            isSigningIn = false
            return
        }

        guard let presentingViewController = topViewController() else {
            errorMessage = "ログイン画面を表示する ViewController が見つかりません"
            isSigningIn = false
            return
        }

        guard let issuerURL = URL(string: OIDCConfig.issuer) else {
            errorMessage = "Issuer URL が不正です"
            isSigningIn = false
            return
        }

        errorMessage = nil
        isSigningIn = true
        statusMessage = "Discovery を取得中"
        logAuthInfo(
            "Cognito sign-in start. issuer=\(OIDCConfig.issuer), clientID=\(OIDCConfig.clientID), redirectURI=\(OIDCConfig.redirectURI), scopes=\(OIDCConfig.scopes.joined(separator: " "))"
        )

        OIDAuthorizationService.discoverConfiguration(forIssuer: issuerURL) { [weak self] configuration, error in
            guard let self else { return }

            Task { @MainActor in
                guard let configuration else {
                    self.statusMessage = "Discovery 取得失敗"
                    let details = self.describeAuthError(error)
                    self.errorMessage = "Discovery 取得失敗: \(details)"
                    self.logAuthError("Discovery failed", error: error)
                    self.isSigningIn = false
                    return
                }

                guard let redirectURL = URL(string: OIDCConfig.redirectURI) else {
                    self.statusMessage = "認証開始失敗"
                    self.errorMessage = "Redirect URI が不正です"
                    self.isSigningIn = false
                    return
                }

                let request = OIDAuthorizationRequest(
                    configuration: configuration,
                    clientId: OIDCConfig.clientID,
                    scopes: OIDCConfig.scopes,
                    redirectURL: redirectURL,
                    responseType: OIDResponseTypeCode,
                    additionalParameters: nil
                )

                self.statusMessage = "Cognito ログイン画面を表示中"
                self.currentAuthorizationFlow = OIDAuthState.authState(
                    byPresenting: request,
                    presenting: presentingViewController
                ) { authState, authError in
                    Task { @MainActor in
                        if let authState {
                            self.setAuthState(authState)
                            self.statusMessage = "認証済み"
                            self.errorMessage = nil
                            self.logAuthInfo("Cognito sign-in succeeded")
                        } else {
                            self.statusMessage = "認証失敗"
                            let details = self.describeAuthError(authError)
                            self.errorMessage = "認証失敗: \(details)"
                            self.logAuthError("Authorization failed", error: authError)
                        }
                        self.isSigningIn = false
                    }
                }
            }
        }
    }

    func fetchUserInfo() {
        guard
            let authState,
            let userInfoEndpoint = authState.lastAuthorizationResponse
                .request.configuration.discoveryDocument?.userinfoEndpoint
        else {
            errorMessage = "UserInfo endpoint が見つかりません"
            return
        }

        statusMessage = "UserInfo を取得中"

        authState.performAction { [weak self] accessToken, _, error in
            guard let self else { return }

            if let error {
                Task { @MainActor in
                    self.statusMessage = "UserInfo 取得失敗"
                    self.errorMessage = "アクセストークン取得失敗: \(error.localizedDescription)"
                }
                return
            }

            guard let accessToken else {
                Task { @MainActor in
                    self.statusMessage = "UserInfo 取得失敗"
                    self.errorMessage = "アクセストークンが空です"
                }
                return
            }

            var request = URLRequest(url: userInfoEndpoint)
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

            URLSession.shared.dataTask(with: request) { data, _, requestError in
                if let requestError {
                    Task { @MainActor in
                        self.statusMessage = "UserInfo 取得失敗"
                        self.errorMessage = "UserInfo リクエスト失敗: \(requestError.localizedDescription)"
                    }
                    return
                }

                guard let data else {
                    Task { @MainActor in
                        self.statusMessage = "UserInfo 取得失敗"
                        self.errorMessage = "UserInfo レスポンスが空です"
                    }
                    return
                }

                do {
                    let jsonObject = try JSONSerialization.jsonObject(with: data, options: [])
                    let dictionary = jsonObject as? [String: Any] ?? [:]
                    Task { @MainActor in
                        self.userInfo = dictionary
                        self.statusMessage = "UserInfo 取得完了"
                        self.errorMessage = nil
                    }
                } catch {
                    Task { @MainActor in
                        self.statusMessage = "UserInfo 取得失敗"
                        self.errorMessage = "JSON 解析失敗"
                    }
                }
            }.resume()
        }
    }

    func callBackendExample() async {
        do {
            statusMessage = "Backend API を呼び出し中"
            backendResponse = try await APIClient.shared.getJSON(path: "/health", accessToken: try await validAccessToken())
            statusMessage = "Backend API 呼び出し完了"
            errorMessage = nil
        } catch {
            statusMessage = "Backend API 呼び出し失敗"
            errorMessage = error.localizedDescription
        }
    }

    func logout() {
        setAuthState(nil)
        setTokenSession(nil)
        userInfo = [:]
        backendResponse = [:]
        errorMessage = nil
        statusMessage = "ログアウト済み"
        logAuthInfo("Local sign-out completed")
    }

    func resumeExternalUserAgentFlow(with url: URL) -> Bool {
        guard let flow = currentAuthorizationFlow else { return false }
        if flow.resumeExternalUserAgentFlow(with: url) {
            currentAuthorizationFlow = nil
            statusMessage = "ログインコールバックを受信"
            return true
        }
        return false
    }

    func validAccessToken() async throws -> String {
        if let tokenSession {
            if tokenSession.expiresAt.timeIntervalSinceNow > 60 {
                return tokenSession.accessToken
            }

            if let refreshedSession = try await refreshTokenSession(tokenSession) {
                setTokenSession(refreshedSession)
                return refreshedSession.accessToken
            }
        }

        guard let authState else {
            throw AuthServiceError.notAuthenticated
        }

        return try await withCheckedThrowingContinuation { continuation in
            authState.performAction { accessToken, _, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let accessToken else {
                    continuation.resume(throwing: AuthServiceError.missingAccessToken)
                    return
                }

                continuation.resume(returning: accessToken)
            }
        }
    }

    private func refreshTokenSession(_ session: CognitoTokenSession) async throws -> CognitoTokenSession? {
        guard let refreshToken = session.refreshToken, !refreshToken.isEmpty else {
            return nil
        }

        statusMessage = "トークンを更新中"
        let response = try await requestCognitoAuth(
            body: CognitoInitiateAuthRequest(
                authFlow: "REFRESH_TOKEN_AUTH",
                clientId: OIDCConfig.clientID,
                authParameters: [
                    "REFRESH_TOKEN": refreshToken
                ]
            )
        )

        guard let result = response.authenticationResult else {
            throw CognitoDirectAuthError.unsupportedChallenge(response.challengeName ?? "unknown")
        }

        return CognitoTokenSession(
            accessToken: result.accessToken,
            idToken: result.idToken ?? session.idToken,
            refreshToken: result.refreshToken ?? refreshToken,
            expiresAt: Date().addingTimeInterval(TimeInterval(result.expiresIn)),
            tokenType: result.tokenType
        )
    }

    private func requestCognitoAuth(body: CognitoInitiateAuthRequest) async throws -> CognitoInitiateAuthResponse {
        guard let endpoint = OIDCConfig.cognitoIdentityProviderEndpoint else {
            throw CognitoDirectAuthError.invalidIssuer
        }

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/x-amz-json-1.1", forHTTPHeaderField: "Content-Type")
        request.setValue("AWSCognitoIdentityProviderService.InitiateAuth", forHTTPHeaderField: "X-Amz-Target")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw CognitoDirectAuthError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            let errorResponse = try? JSONDecoder().decode(CognitoErrorResponse.self, from: data)
            throw CognitoDirectAuthError.service(
                statusCode: httpResponse.statusCode,
                type: errorResponse?.type,
                message: errorResponse?.message ?? String(decoding: data, as: UTF8.self)
            )
        }

        return try JSONDecoder().decode(CognitoInitiateAuthResponse.self, from: data)
    }

    private func setAuthState(_ authState: OIDAuthState?) {
        self.authState = authState
        self.authState?.stateChangeDelegate = self
        self.authState?.errorDelegate = self
        saveState()
    }

    private func setTokenSession(_ tokenSession: CognitoTokenSession?) {
        self.tokenSession = tokenSession
        saveTokenSession()
    }

    private func saveState() {
        guard let authState else {
            UserDefaults.standard.removeObject(forKey: Self.authStateStorageKey)
            return
        }

        let archiver = NSKeyedArchiver(requiringSecureCoding: false)
        archiver.encode(authState, forKey: NSKeyedArchiveRootObjectKey)
        archiver.finishEncoding()
        UserDefaults.standard.set(archiver.encodedData, forKey: Self.authStateStorageKey)
    }

    private func saveTokenSession() {
        guard let tokenSession else {
            UserDefaults.standard.removeObject(forKey: Self.tokenSessionStorageKey)
            return
        }

        do {
            let data = try JSONEncoder().encode(tokenSession)
            UserDefaults.standard.set(data, forKey: Self.tokenSessionStorageKey)
        } catch {
            logAuthError("Token session save failed", error: error)
        }
    }

    private func loadStoredAuthentication() {
        loadTokenSession()
        loadState()
    }

    private func loadTokenSession() {
        guard let data = UserDefaults.standard.data(forKey: Self.tokenSessionStorageKey) else {
            return
        }

        do {
            tokenSession = try JSONDecoder().decode(CognitoTokenSession.self, from: data)
            statusMessage = "認証済み"
        } catch {
            UserDefaults.standard.removeObject(forKey: Self.tokenSessionStorageKey)
            statusMessage = "未認証"
            errorMessage = "保存済みトークンの復元に失敗しました"
            logAuthError("Stored token restore failed", error: error)
        }
    }

    private func loadState() {
        guard let data = UserDefaults.standard.data(forKey: Self.authStateStorageKey) else {
            return
        }

        do {
            let unarchiver = try NSKeyedUnarchiver(forReadingFrom: data)
            unarchiver.requiresSecureCoding = false
            let restoredState = unarchiver.decodeObject(forKey: NSKeyedArchiveRootObjectKey) as? OIDAuthState
            unarchiver.finishDecoding()
            setAuthState(restoredState)
            statusMessage = restoredState?.isAuthorized == true ? "認証済み" : "未認証"
        } catch {
            UserDefaults.standard.removeObject(forKey: Self.authStateStorageKey)
            statusMessage = "未認証"
            errorMessage = "保存済み認証情報の復元に失敗しました"
        }
    }

    private func logAuthInfo(_ message: String) {
        logger.info("\(message, privacy: .public)")
        print("[AuthService] \(message)")
    }

    private func logAuthError(_ context: String, error: Error?) {
        let message = "\(context): \(describeAuthError(error))"
        logger.error("\(message, privacy: .public)")
        print("[AuthService] \(message)")
    }

    private func describeAuthError(_ error: Error?) -> String {
        guard let error else {
            return "unknown"
        }

        let nsError = error as NSError
        var parts = [
            nsError.localizedDescription,
            "domain=\(nsError.domain)",
            "code=\(nsError.code)"
        ]

        let userInfo = nsError.userInfo
            .sorted { String(describing: $0.key) < String(describing: $1.key) }
            .map { key, value in
                "\(key)=\(value)"
            }

        if !userInfo.isEmpty {
            parts.append("userInfo={\(userInfo.joined(separator: ", "))}")
        }

        return parts.joined(separator: " | ")
    }

    private func topViewController(
        from controller: UIViewController? = nil
    ) -> UIViewController? {
        let rootController = controller ?? UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController

        if let navigationController = rootController as? UINavigationController {
            return topViewController(from: navigationController.visibleViewController)
        }

        if let tabBarController = rootController as? UITabBarController {
            return topViewController(from: tabBarController.selectedViewController)
        }

        if let presentedViewController = rootController?.presentedViewController {
            return topViewController(from: presentedViewController)
        }

        return rootController
    }
}

extension AuthService: OIDAuthStateChangeDelegate, OIDAuthStateErrorDelegate {
    nonisolated func didChange(_ state: OIDAuthState) {
        Task { @MainActor in
            self.authState = state
            self.saveState()
        }
    }

    nonisolated func authState(_ state: OIDAuthState, didEncounterAuthorizationError error: Error) {
        Task { @MainActor in
            self.statusMessage = "認証エラー"
            self.errorMessage = "認証エラー: \(error.localizedDescription)"
            self.authState = state
            self.saveState()
        }
    }
}

enum AuthServiceError: LocalizedError {
    case notAuthenticated
    case missingAccessToken

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "先に Cognito へログインしてください"
        case .missingAccessToken:
            return "アクセストークンが取得できませんでした"
        }
    }
}

private struct CognitoTokenSession: Codable {
    let accessToken: String
    let idToken: String?
    let refreshToken: String?
    let expiresAt: Date
    let tokenType: String
}

private struct CognitoInitiateAuthRequest: Encodable {
    let authFlow: String
    let clientId: String
    let authParameters: [String: String]

    enum CodingKeys: String, CodingKey {
        case authFlow = "AuthFlow"
        case clientId = "ClientId"
        case authParameters = "AuthParameters"
    }
}

private struct CognitoInitiateAuthResponse: Decodable {
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

private struct CognitoErrorResponse: Decodable {
    let type: String?
    let message: String?

    enum CodingKeys: String, CodingKey {
        case type = "__type"
        case message
    }
}

private enum CognitoDirectAuthError: LocalizedError {
    case invalidIssuer
    case invalidResponse
    case unsupportedChallenge(String)
    case service(statusCode: Int, type: String?, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidIssuer:
            return "Cognito issuer から認証APIエンドポイントを作成できませんでした"
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
