import Combine
import Foundation
import UIKit
import AppAuth

@MainActor
final class AuthService: NSObject, ObservableObject {
    @Published var authState: OIDAuthState?
    @Published var userInfo: [String: Any] = [:]
    @Published var backendResponse: [String: Any] = [:]
    @Published var errorMessage: String?
    @Published var statusMessage = "未認証"

    private var currentAuthorizationFlow: OIDExternalUserAgentSession?

    var isAuthenticated: Bool {
        authState?.isAuthorized == true
    }

    func discoverAndSignIn() {
        if let configurationError = OIDCConfig.configurationError {
            errorMessage = configurationError
            statusMessage = "認証設定エラー"
            return
        }

        guard let presentingViewController = topViewController() else {
            errorMessage = "ログイン画面を表示する ViewController が見つかりません"
            return
        }

        guard let issuerURL = URL(string: OIDCConfig.issuer) else {
            errorMessage = "Issuer URL が不正です"
            return
        }

        errorMessage = nil
        statusMessage = "Discovery を取得中"

        OIDAuthorizationService.discoverConfiguration(forIssuer: issuerURL) { [weak self] configuration, error in
            guard let self else { return }

            Task { @MainActor in
                guard let configuration else {
                    self.statusMessage = "Discovery 取得失敗"
                    self.errorMessage = "Discovery 取得失敗: \(error?.localizedDescription ?? "unknown")"
                    return
                }

                guard let redirectURL = URL(string: OIDCConfig.redirectURI) else {
                    self.statusMessage = "認証開始失敗"
                    self.errorMessage = "Redirect URI が不正です"
                    return
                }

                let request = OIDAuthorizationRequest(
                    configuration: configuration,
                    clientId: OIDCConfig.clientID,
                    scopes: [OIDScopeOpenID, OIDScopeProfile],
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
                            self.authState = authState
                            self.statusMessage = "認証済み"
                            self.errorMessage = nil
                        } else {
                            self.statusMessage = "認証失敗"
                            self.errorMessage = "認証失敗: \(authError?.localizedDescription ?? "unknown")"
                        }
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
        if let configurationError = OIDCConfig.configurationError {
            errorMessage = configurationError
            statusMessage = "認証設定エラー"
            return
        }

        guard
            let authState,
            let endSessionEndpoint = authState.lastAuthorizationResponse
                .request.configuration.discoveryDocument?.endSessionEndpoint
        else {
            errorMessage = "EndSession endpoint が見つかりません"
            return
        }

        var components = URLComponents(url: endSessionEndpoint, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "client_id", value: OIDCConfig.clientID),
            URLQueryItem(name: "logout_uri", value: OIDCConfig.logoutURL)
        ]

        guard let logoutURL = components?.url else {
            errorMessage = "logout URL 生成失敗"
            return
        }

        UIApplication.shared.open(logoutURL, options: [:], completionHandler: nil)
        self.authState = nil
        self.userInfo = [:]
        self.backendResponse = [:]
        self.statusMessage = "ログアウト済み"
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

    private func validAccessToken() async throws -> String {
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
