import Foundation

@MainActor
final class AuthSessionRepositoryImpl: AuthSessionRepository {
    private let authClient: AppAuthClient
    private let store: any AuthStateStore
    private var continuation: AsyncStream<AuthSession?>.Continuation?
    private var refreshAccessTokenTask: Task<String, Error>?

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

        cancelRefreshAccessTokenTask()
        let session = try await authClient.signIn(username: username, password: password)
        cancelRefreshAccessTokenTask()
        currentSession = session
        try store.saveSession(session)
        return session
    }

    func signOut() {
        cancelRefreshAccessTokenTask()
        clearSession()
    }

    func accessToken() async throws -> String {
        guard let session = currentSession else {
            throw AuthRepositoryError.notAuthenticated
        }

        if session.isAccessTokenValid {
            return session.accessToken
        }

        return try await refreshAccessToken()
    }

    func refreshAccessToken() async throws -> String {
        if let refreshAccessTokenTask {
            return try await refreshAccessTokenTask.value
        }

        guard let session = currentSession else {
            throw AuthRepositoryError.notAuthenticated
        }

        let task = Task { @MainActor in
            do {
                guard let refreshed = try await self.authClient.refresh(session: session) else {
                    self.clearSessionIfCurrentSessionMatches(session)
                    throw AuthRepositoryError.missingRefreshToken
                }

                try Task.checkCancellation()
                guard self.currentSession == session else {
                    throw AuthRepositoryError.notAuthenticated
                }

                self.currentSession = refreshed
                try self.store.saveSession(refreshed)
                return refreshed.accessToken
            } catch {
                if Self.shouldClearSession(afterRefreshError: error) {
                    self.clearSessionIfCurrentSessionMatches(session)
                }
                throw error
            }
        }

        refreshAccessTokenTask = task

        do {
            let accessToken = try await task.value
            refreshAccessTokenTask = nil
            return accessToken
        } catch {
            refreshAccessTokenTask = nil
            throw error
        }
    }

    func resumeExternalUserAgentFlow(with url: URL) -> Bool {
        authClient.resumeExternalUserAgentFlow(with: url)
    }

    private func clearSession() {
        currentSession = nil
        try? store.saveSession(nil)
    }

    private func cancelRefreshAccessTokenTask() {
        refreshAccessTokenTask?.cancel()
        refreshAccessTokenTask = nil
    }

    private func clearSessionIfCurrentSessionMatches(_ session: AuthSession) {
        guard currentSession == session else {
            return
        }

        clearSession()
    }

    private static func shouldClearSession(afterRefreshError error: any Error) -> Bool {
        if let repositoryError = error as? AuthRepositoryError {
            switch repositoryError {
            case .missingRefreshToken:
                return true
            case .emptyUsername, .emptyPassword, .notAuthenticated:
                return false
            }
        }

        if let authClientError = error as? AppAuthClientError {
            return authClientError.invalidatesRefreshSession
        }

        return false
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
