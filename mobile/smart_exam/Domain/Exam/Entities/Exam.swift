import Foundation

enum ExamMode: String, Codable, Hashable, Sendable {
    case material = "MATERIAL"
    case kanji = "KANJI"
}

enum SubjectId: String, Codable, Hashable, Sendable {
    case japanese = "1"
    case science = "2"
    case society = "3"
    case math = "4"
}

enum ExamStatus: String, Codable, Hashable, Sendable {
    case inProgress = "IN_PROGRESS"
    case completed = "COMPLETED"
}

struct Exam: Identifiable, Codable, Hashable, Sendable {
    struct PDFInfo: Codable, Hashable, Sendable {
        let url: String
        let downloadUrl: String
    }

    struct Result: Codable, Hashable, Sendable {
        let id: String
        let isCorrect: Bool
    }

    let examId: String
    let subject: SubjectId
    let mode: ExamMode
    let createdDate: String
    let submittedDate: String?
    let status: ExamStatus
    let pdf: PDFInfo
    let count: Int
    let results: [Result]

    var id: String {
        examId
    }

    var correctCount: Int {
        results.filter(\.isCorrect).count
    }
}

typealias ReviewExam = Exam
