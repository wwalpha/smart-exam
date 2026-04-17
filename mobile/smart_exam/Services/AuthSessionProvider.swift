import Combine
import Foundation

@MainActor
protocol AuthSessionProviding: ObservableObject {
    var isAuthenticated: Bool { get }
    func signIn()
    func signOut()
}

@MainActor
final class MockAuthSessionProvider: AuthSessionProviding {
    @Published private(set) var isAuthenticated = false

    func signIn() {
        isAuthenticated = true
    }

    func signOut() {
        isAuthenticated = false
    }
}
