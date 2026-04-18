import Foundation

@MainActor
protocol AuthSessionRepository {
    var currentSession: AuthSession? { get }
    var sessionStream: AsyncStream<AuthSession?> { get }

    func signIn(username: String, password: String) async throws -> AuthSession
    func signOut()
    func accessToken() async throws -> String
    func refreshAccessToken() async throws -> String
}
