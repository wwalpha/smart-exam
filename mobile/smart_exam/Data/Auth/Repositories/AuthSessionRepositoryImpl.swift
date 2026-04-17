import Foundation

@MainActor
final class AuthSessionRepositoryImpl: AuthSessionRepository {
    private let authClient: AppAuthClient
    private let store: any AuthStateStore
    private var continuation: AsyncStream<AuthSession?>.Continuation?

    private(set) var currentSession: AuthSession? {
        didSet {
            continuation?.yield(currentSession)
        }
    }

    var sessionStream: AsyncStream<AuthSession?> {
        AsyncStream { continuation in
            self.continuation = continuation
            continuation.yield(self.currentSession)
        }
    }

    init(authClient: AppAuthClient, store: any AuthStateStore) {
        self.authClient = authClient
        self.store = store
        self.currentSession = try? store.loadSession()
    }

    func signIn(username: String, password: String) async throws -> AuthSession {
        guard !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw AuthRepositoryError.emptyUsername
        }

        guard !password.isEmpty else {
            throw AuthRepositoryError.emptyPassword
        }

        let session = try await authClient.signIn(username: username, password: password)
        currentSession = session
        try store.saveSession(session)
        return session
    }

    func signOut() {
        currentSession = nil
        try? store.saveSession(nil)
    }

    func accessToken() async throws -> String {
        guard let session = currentSession else {
            throw AuthRepositoryError.notAuthenticated
        }

        if session.isAccessTokenValid {
            return session.accessToken
        }

        guard let refreshed = try await authClient.refresh(session: session) else {
            throw AuthRepositoryError.missingRefreshToken
        }

        currentSession = refreshed
        try store.saveSession(refreshed)
        return refreshed.accessToken
    }

    func resumeExternalUserAgentFlow(with url: URL) -> Bool {
        authClient.resumeExternalUserAgentFlow(with: url)
    }
}

enum AuthRepositoryError: LocalizedError {
    case emptyUsername
    case emptyPassword
    case notAuthenticated
    case missingRefreshToken

    var errorDescription: String? {
        switch self {
        case .emptyUsername:
            return "メールアドレスを入力してください"
        case .emptyPassword:
            return "パスワードを入力してください"
        case .notAuthenticated:
            return "先に Cognito へログインしてください"
        case .missingRefreshToken:
            return "リフレッシュトークンが取得できませんでした"
        }
    }
}
