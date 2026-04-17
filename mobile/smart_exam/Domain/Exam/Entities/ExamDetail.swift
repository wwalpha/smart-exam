import Foundation

struct ExamDetail: Identifiable, Codable, Hashable, Sendable {
    let examId: String
    let subject: SubjectId
    let mode: ExamMode
    let createdDate: String
    let submittedDate: String?
    let status: ExamStatus
    let pdf: Exam.PDFInfo
    let count: Int
    let results: [Exam.Result]
    let items: [ExamItem]

    var id: String {
        examId
    }

    var correctCount: Int {
        results.filter(\.isCorrect).count
    }
}

typealias ReviewExamDetail = ExamDetail
