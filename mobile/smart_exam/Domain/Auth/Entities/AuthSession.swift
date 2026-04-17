import Foundation

struct AuthSession: Codable, Equatable, Sendable {
    let accessToken: String
    let idToken: String?
    let refreshToken: String?
    let expiresAt: Date
    let tokenType: String

    var isAccessTokenValid: Bool {
        expiresAt.timeIntervalSinceNow > 60
    }
}
