import Alamofire
import Foundation

final class APIClient {
    static let shared = APIClient()

    private init() {}

    func postJSON<Request: Encodable, Response: Decodable>(
        path: String,
        body: Request,
        accessToken: String? = nil
    ) async throws -> Response {
        guard !OIDCConfig.backendBaseURL.isEmpty, let baseURL = URL(string: OIDCConfig.backendBaseURL) else {
            throw APIClientError.missingBaseURL
        }

        var headers: HTTPHeaders = [.contentType("application/json")]
        if let accessToken, !accessToken.isEmpty {
            headers.add(.authorization(bearerToken: accessToken))
        }

        return try await AF.request(
            baseURL.appending(path: path),
            method: .post,
            parameters: body,
            encoder: JSONParameterEncoder.default,
            headers: headers
        )
        .validate()
        .serializingDecodable(Response.self)
        .value
    }

    func getDecodable<Response: Decodable>(
        path: String,
        accessToken: String? = nil
    ) async throws -> Response {
        guard !OIDCConfig.backendBaseURL.isEmpty, let baseURL = URL(string: OIDCConfig.backendBaseURL) else {
            throw APIClientError.missingBaseURL
        }

        var headers: HTTPHeaders = []
        if let accessToken, !accessToken.isEmpty {
            headers.add(.authorization(bearerToken: accessToken))
        }

        return try await AF.request(
            baseURL.appending(path: path),
            headers: headers
        )
        .validate()
        .serializingDecodable(Response.self)
        .value
    }

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
