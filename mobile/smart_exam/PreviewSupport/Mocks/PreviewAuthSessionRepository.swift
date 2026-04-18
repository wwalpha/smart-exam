import Foundation

@MainActor
final class PreviewAuthSessionRepository: AuthSessionRepository {
    private var session: AuthSession?

    var currentSession: AuthSession? {
        session
    }

    var sessionStream: AsyncStream<AuthSession?> {
        AsyncStream { continuation in
            continuation.yield(session)
        }
    }

    func signIn(username: String, password: String) async throws -> AuthSession {
        let session = AuthSession(
            accessToken: "preview",
            idToken: nil,
            refreshToken: nil,
            expiresAt: Date().addingTimeInterval(3600),
            tokenType: "Bearer"
        )
        self.session = session
        return session
    }

    func signOut() {
        session = nil
    }

    func accessToken() async throws -> String {
        "preview"
    }

    func refreshAccessToken() async throws -> String {
        "preview"
    }
}
