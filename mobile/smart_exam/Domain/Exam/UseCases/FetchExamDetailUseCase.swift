import Foundation

struct FetchExamDetailUseCase {
    private let repository: any ExamRepository

    init(repository: any ExamRepository) {
        self.repository = repository
    }

    func execute(examId: String) async throws -> ExamDetail {
        try await repository.fetchExamDetail(examId: examId)
    }
}
