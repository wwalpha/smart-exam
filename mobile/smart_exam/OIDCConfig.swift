import Foundation

enum OIDCConfig {
    private static let resourceName = "LocalOIDCConfig"
    private static let requiredKeys = [
        "issuer",
        "clientID",
        "redirectURI",
        "logoutURL",
    ]

    private static let fileURL = Bundle.main.url(forResource: resourceName, withExtension: "plist")
    private static let values: [String: Any] = {
        guard
            let fileURL,
            let dictionary = NSDictionary(contentsOf: fileURL) as? [String: Any]
        else {
            return [:]
        }

        return dictionary
    }()

    static let issuer = stringValue(forKey: "issuer")
    static let clientID = stringValue(forKey: "clientID")
    static let redirectURI = stringValue(forKey: "redirectURI")
    static let logoutURL = stringValue(forKey: "logoutURL")
    static let backendBaseURL = stringValue(forKey: "backendBaseURL")

    static var configurationError: String? {
        guard fileURL != nil else {
            return "\(resourceName).plist がバンドルされていません"
        }

        let missingKeys = requiredKeys.filter { stringValue(forKey: $0).isEmpty }
        guard missingKeys.isEmpty else {
            return "\(resourceName).plist の必須キーが不足しています: \(missingKeys.joined(separator: ", "))"
        }

        return nil
    }

    private static func stringValue(forKey key: String) -> String {
        values[key] as? String ?? ""
    }
}
