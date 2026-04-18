import Foundation

final class ExamRemoteDataSource {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func fetchExamList(request: SearchExamsRequestDTO) async throws -> ExamListResponseDTO {
        try await apiClient.postJSON(
            path: "/api/exam/search",
            body: request,
            requiresAuthorization: true
        )
    }

    func fetchExamDetail(examId: String) async throws -> ExamDetailDTO {
        try await apiClient.getDecodable(
            path: "/api/exam/\(examId)",
            requiresAuthorization: true
        )
    }
}
