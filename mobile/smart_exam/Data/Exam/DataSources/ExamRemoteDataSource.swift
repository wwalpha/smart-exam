import Foundation

final class ExamRemoteDataSource {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func fetchExamList(request: SearchExamsRequestDTO, accessToken: String) async throws -> ExamListResponseDTO {
        try await apiClient.postJSON(
            path: "/api/exam/search",
            body: request,
            accessToken: accessToken
        )
    }

    func fetchExamDetail(examId: String, accessToken: String) async throws -> ExamDetailDTO {
        try await apiClient.getDecodable(
            path: "/api/exam/\(examId)",
            accessToken: accessToken
        )
    }
}
