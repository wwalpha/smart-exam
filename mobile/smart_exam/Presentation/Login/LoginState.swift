import Foundation

struct LoginState: Equatable {
    var isSigningIn = false
    var statusMessage = "未認証"
    var errorMessage: String?
}
