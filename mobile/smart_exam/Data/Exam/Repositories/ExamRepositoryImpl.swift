import Foundation

final class ExamRepositoryImpl: ExamRepository {
    private let remoteDataSource: ExamRemoteDataSource
    private let accessTokenProvider: () async throws -> String

    init(
        remoteDataSource: ExamRemoteDataSource,
        accessTokenProvider: @escaping () async throws -> String
    ) {
        self.remoteDataSource = remoteDataSource
        self.accessTokenProvider = accessTokenProvider
    }

    func fetchExamList(mode: ExamMode, status: String?, limit: Int?) async throws -> ExamListResult {
        let token = try await accessTokenProvider()
        let response = try await remoteDataSource.fetchExamList(
            request: SearchExamsRequestDTO(mode: mode, status: status, limit: limit),
            accessToken: token
        )

        return ExamListResult(
            items: response.items.map(ExamMapper.map),
            total: response.total,
            cursor: response.cursor
        )
    }

    func fetchExamDetail(examId: String) async throws -> ExamDetail {
        let token = try await accessTokenProvider()
        let response = try await remoteDataSource.fetchExamDetail(examId: examId, accessToken: token)
        return ExamMapper.map(response)
    }
}
