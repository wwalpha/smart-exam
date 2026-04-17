import Foundation

final class UserDefaultsAuthStateStore: AuthStateStore {
    private let key: String
    private let userDefaults: UserDefaults

    init(
        key: String = "cognitoTokenSession",
        userDefaults: UserDefaults = .standard
    ) {
        self.key = key
        self.userDefaults = userDefaults
    }

    func loadSession() throws -> AuthSession? {
        guard let data = userDefaults.data(forKey: key) else {
            return nil
        }

        return try JSONDecoder().decode(AuthSession.self, from: data)
    }

    func saveSession(_ session: AuthSession?) throws {
        guard let session else {
            userDefaults.removeObject(forKey: key)
            return
        }

        let data = try JSONEncoder().encode(session)
        userDefaults.set(data, forKey: key)
    }
}
