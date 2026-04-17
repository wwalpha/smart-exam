import Foundation

struct ExamListResponseDTO: Decodable {
    let items: [ExamDTO]
    let total: Int
    let cursor: String?
}

struct SearchExamsRequestDTO: Encodable {
    let subject: String
    let mode: ExamMode
    let status: String?
    let limit: Int?
    let cursor: String?

    init(
        subject: String = "ALL",
        mode: ExamMode,
        status: String? = "ALL",
        limit: Int? = nil,
        cursor: String? = nil
    ) {
        self.subject = subject
        self.mode = mode
        self.status = status
        self.limit = limit
        self.cursor = cursor
    }
}

struct ExamDTO: Decodable {
    let examId: String
    let subject: SubjectId
    let mode: ExamMode
    let createdDate: String
    let submittedDate: String?
    let status: ExamStatus
    let pdf: ExamPDFInfoDTO
    let count: Int
    let results: [ExamResultDTO]
}

struct ExamPDFInfoDTO: Decodable {
    let url: String
    let downloadUrl: String
}

struct ExamResultDTO: Decodable {
    let id: String
    let isCorrect: Bool
}
