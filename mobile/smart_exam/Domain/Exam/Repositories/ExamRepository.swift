import Foundation

struct ExamListResult: Equatable {
    let items: [Exam]
    let total: Int
    let cursor: String?
}

protocol ExamRepository {
    func fetchExamList(mode: ExamMode, status: String?, limit: Int?) async throws -> ExamListResult
    func fetchExamDetail(examId: String) async throws -> ExamDetail
}
