import Foundation

struct FetchExamListUseCase {
    private let repository: any ExamRepository

    init(repository: any ExamRepository) {
        self.repository = repository
    }

    func execute(mode: ExamMode = .material, status: String? = "ALL", limit: Int? = 50) async throws -> ExamListResult {
        try await repository.fetchExamList(mode: mode, status: status, limit: limit)
    }
}
