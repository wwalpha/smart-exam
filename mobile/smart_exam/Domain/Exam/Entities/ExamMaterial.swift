import Foundation

struct ExamItem: Identifiable, Codable, Hashable, Sendable {
    struct UnderlineSpec: Codable, Hashable, Sendable {
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
    let underlineSpec: UnderlineSpec?
    let isCorrect: Bool?
    let itemId: String?
}

typealias ReviewExamItem = ExamItem
