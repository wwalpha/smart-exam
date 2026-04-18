import Foundation

final class ExamRepositoryImpl: ExamRepository {
    private let remoteDataSource: ExamRemoteDataSource

    init(remoteDataSource: ExamRemoteDataSource) {
        self.remoteDataSource = remoteDataSource
    }

    func fetchExamList(mode: ExamMode, status: String?, limit: Int?) async throws -> ExamListResult {
        let response = try await remoteDataSource.fetchExamList(
            request: SearchExamsRequestDTO(mode: mode, status: status, limit: limit)
        )

        return ExamListResult(
            items: response.items.map(ExamMapper.map),
            total: response.total,
            cursor: response.cursor
        )
    }

    func fetchExamDetail(examId: String) async throws -> ExamDetail {
        let response = try await remoteDataSource.fetchExamDetail(examId: examId)
        return ExamMapper.map(response)
    }
}
