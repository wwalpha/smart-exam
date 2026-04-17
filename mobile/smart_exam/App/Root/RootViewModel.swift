import Combine
import Foundation

@MainActor
final class RootViewModel: ObservableObject {
    @Published private(set) var isAuthenticated = false

    private let observeAuthSessionUseCase: ObserveAuthSessionUseCase
    private let signOutUseCase: SignOutUseCase
    private var observationTask: Task<Void, Never>?

    init(
        observeAuthSessionUseCase: ObserveAuthSessionUseCase,
        signOutUseCase: SignOutUseCase
    ) {
        self.observeAuthSessionUseCase = observeAuthSessionUseCase
        self.signOutUseCase = signOutUseCase
    }

    func start() {
        guard observationTask == nil else {
            return
        }

        observationTask = Task {
            for await session in observeAuthSessionUseCase.execute() {
                isAuthenticated = session != nil
            }
        }
    }

    func signOut() {
        signOutUseCase.execute()
    }
}
