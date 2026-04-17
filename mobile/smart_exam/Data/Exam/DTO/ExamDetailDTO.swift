import Foundation

struct ExamDetailDTO: Decodable {
    let examId: String
    let subject: SubjectId
    let mode: ExamMode
    let createdDate: String
    let submittedDate: String?
    let status: ExamStatus
    let pdf: ExamPDFInfoDTO
    let count: Int
    let results: [ExamResultDTO]
    let items: [ExamItemDTO]
}

struct ExamItemDTO: Decodable {
    struct UnderlineSpecDTO: Decodable {
        let type: String?
        let start: Int?
        let length: Int?
    }

    let id: String
    let examId: String?
    let targetType: ExamMode?
    let targetId: String?
    let displayLabel: String?
    let canonicalKey: String?
    let kanji: String?
    let materialId: String?
    let grade: String?
    let provider: String?
    let materialName: String?
    let materialDate: String?
    let questionText: String?
    let answerText: String?
    let correctAnswer: String?
    let readingHiragana: String?
    let underlineSpec: UnderlineSpecDTO?
    let isCorrect: Bool?
    let itemId: String?
}
