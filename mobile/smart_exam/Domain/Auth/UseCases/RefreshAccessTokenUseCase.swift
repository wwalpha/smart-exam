import Foundation

@MainActor
struct RefreshAccessTokenUseCase {
    private let repository: any AuthSessionRepository

    init(repository: any AuthSessionRepository) {
        self.repository = repository
    }

    func execute() async throws -> String {
        try await repository.refreshAccessToken()
    }
}
