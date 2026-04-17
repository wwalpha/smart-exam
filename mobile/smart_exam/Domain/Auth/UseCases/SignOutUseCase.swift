import Foundation

@MainActor
struct SignOutUseCase {
    private let repository: any AuthSessionRepository

    init(repository: any AuthSessionRepository) {
        self.repository = repository
    }

    func execute() {
        repository.signOut()
    }
}
