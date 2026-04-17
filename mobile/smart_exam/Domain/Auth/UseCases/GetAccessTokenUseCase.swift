import Foundation

@MainActor
struct GetAccessTokenUseCase {
    private let repository: any AuthSessionRepository

    init(repository: any AuthSessionRepository) {
        self.repository = repository
    }

    func execute() async throws -> String {
        try await repository.accessToken()
    }
}
