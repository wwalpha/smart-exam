import Alamofire
import Foundation

final class APIClient {
    static let shared = APIClient()

    private init() {}

    func getJSON(path: String, accessToken: String) async throws -> [String: Any] {
        guard !OIDCConfig.backendBaseURL.isEmpty, let baseURL = URL(string: OIDCConfig.backendBaseURL) else {
            throw APIClientError.missingBaseURL
        }

        let responseData = try await AF.request(
            baseURL.appending(path: path),
            headers: [.authorization(bearerToken: accessToken)]
        )
        .validate()
        .serializingData()
        .value

        let object = try JSONSerialization.jsonObject(with: responseData, options: [])
        return object as? [String: Any] ?? ["raw": String(decoding: responseData, as: UTF8.self)]
    }
}

enum APIClientError: LocalizedError {
    case missingBaseURL

    var errorDescription: String? {
        switch self {
        case .missingBaseURL:
            return "OIDCConfig.backendBaseURL に backend API の URL を設定してください"
        }
    }
}
