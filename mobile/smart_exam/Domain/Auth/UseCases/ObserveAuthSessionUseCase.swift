import Foundation

@MainActor
struct ObserveAuthSessionUseCase {
    private let repository: any AuthSessionRepository

    init(repository: any AuthSessionRepository) {
        self.repository = repository
    }

    func execute() -> AsyncStream<AuthSession?> {
        repository.sessionStream
    }
}
