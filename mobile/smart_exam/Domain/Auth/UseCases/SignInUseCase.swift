import Foundation

@MainActor
struct SignInUseCase {
    private let repository: any AuthSessionRepository

    init(repository: any AuthSessionRepository) {
        self.repository = repository
    }

    func execute(username: String, password: String) async throws -> AuthSession {
        try await repository.signIn(username: username, password: password)
    }
}
