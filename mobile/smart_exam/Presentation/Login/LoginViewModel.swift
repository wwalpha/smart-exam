import Combine
import Foundation

@MainActor
final class LoginViewModel: ObservableObject {
    @Published private(set) var state = LoginState()

    private let signInUseCase: SignInUseCase

    init(signInUseCase: SignInUseCase) {
        self.signInUseCase = signInUseCase
    }

    func signIn(username: String, password: String) {
        Task {
            state.isSigningIn = true
            state.statusMessage = "Cognito へログイン中"
            state.errorMessage = nil

            do {
                _ = try await signInUseCase.execute(username: username, password: password)
                state.statusMessage = "認証済み"
                state.errorMessage = nil
            } catch {
                state.statusMessage = "認証失敗"
                state.errorMessage = "認証失敗: \(describe(error))"
            }

            state.isSigningIn = false
        }
    }

    private func describe(_ error: Error) -> String {
        let nsError = error as NSError
        var parts = [
            nsError.localizedDescription,
            "domain=\(nsError.domain)",
            "code=\(nsError.code)"
        ]

        let userInfo = nsError.userInfo
            .sorted { String(describing: $0.key) < String(describing: $1.key) }
            .map { key, value in
                "\(key)=\(value)"
            }

        if !userInfo.isEmpty {
            parts.append("userInfo={\(userInfo.joined(separator: ", "))}")
        }

        return parts.joined(separator: " | ")
    }
}
