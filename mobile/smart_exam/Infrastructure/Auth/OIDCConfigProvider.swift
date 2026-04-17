import Foundation

struct OIDCConfiguration {
    let issuer: String
    let clientID: String
    let redirectURI: String
    let logoutURL: String
    let scopes: [String]
    let backendBaseURL: String
    let identityProviderEndpoint: URL
}

protocol OIDCConfigProviding {
    var configuration: OIDCConfiguration { get throws }
}

struct BundleOIDCConfigProvider: OIDCConfigProviding {
    var configuration: OIDCConfiguration {
        get throws {
            guard
                let endpoint = OIDCConfig.cognitoIdentityProviderEndpoint
            else {
                throw OIDCConfigProviderError.invalidIssuer
            }

            if let configurationError = OIDCConfig.configurationError {
                throw OIDCConfigProviderError.invalidConfiguration(configurationError)
            }

            return OIDCConfiguration(
                issuer: OIDCConfig.issuer,
                clientID: OIDCConfig.clientID,
                redirectURI: OIDCConfig.redirectURI,
                logoutURL: OIDCConfig.logoutURL,
                scopes: OIDCConfig.scopes,
                backendBaseURL: OIDCConfig.backendBaseURL,
                identityProviderEndpoint: endpoint
            )
        }
    }
}

enum OIDCConfigProviderError: LocalizedError {
    case invalidIssuer
    case invalidConfiguration(String)

    var errorDescription: String? {
        switch self {
        case .invalidIssuer:
            return "Cognito issuer から認証APIエンドポイントを作成できませんでした"
        case .invalidConfiguration(let message):
            return message
        }
    }
}
