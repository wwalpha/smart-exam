import Foundation
import SwiftUI

enum ExamMode: String, Codable, Hashable {
    case material = "MATERIAL"
    case kanji = "KANJI"

    var label: String {
        switch self {
        case .material:
            return "問題"
        case .kanji:
            return "漢字"
        }
    }
}

enum SubjectId: String, Codable, Hashable {
    case japanese = "1"
    case science = "2"
    case society = "3"
    case math = "4"

    var label: String {
        switch self {
        case .japanese:
            return "国語"
        case .science:
            return "理科"
        case .society:
            return "社会"
        case .math:
            return "算数"
        }
    }
}

enum ExamStatus: String, Codable, Hashable {
    case inProgress = "IN_PROGRESS"
    case completed = "COMPLETED"

    var label: String {
        switch self {
        case .inProgress:
            return "実施中"
        case .completed:
            return "完了"
        }
    }

    var fillColor: Color {
        switch self {
        case .inProgress:
            AppColor.yellow100
        case .completed:
            AppColor.green100
        }
    }

    var textColor: Color {
        switch self {
        case .inProgress:
            AppColor.yellow700
        case .completed:
            AppColor.green700
        }
    }

    var borderColor: Color {
        switch self {
        case .inProgress:
            AppColor.yellow400
        case .completed:
            AppColor.green400
        }
    }
}

struct ReviewExam: Identifiable, Codable, Hashable {
    struct PDFInfo: Codable, Hashable {
        let url: String
        let downloadUrl: String
    }

    struct Result: Codable, Hashable {
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

struct ReviewExamDetail: Identifiable, Codable, Hashable {
    let examId: String
    let subject: SubjectId
    let mode: ExamMode
    let createdDate: String
    let submittedDate: String?
    let status: ExamStatus
    let pdf: ReviewExam.PDFInfo
    let count: Int
    let results: [ReviewExam.Result]
    let items: [ReviewExamItem]

    var id: String {
        examId
    }

    var correctCount: Int {
        results.filter(\.isCorrect).count
    }
}

struct ReviewExamItem: Identifiable, Codable, Hashable {
    struct UnderlineSpec: Codable, Hashable {
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

struct ExamListResponse: Decodable {
    let items: [ReviewExam]
    let total: Int
    let cursor: String?
}

struct SearchExamsRequest: Encodable {
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

struct Project: Identifiable, Hashable {
    let id: Int
    let title: String
    let description: String
    let status: ProjectStatus
    let date: String
}

enum ProjectStatus: String, Hashable {
    case inProgress = "進行中"
    case complete = "完了"
    case pending = "保留中"

    var fillColor: Color {
        switch self {
        case .inProgress:
            AppColor.yellow100
        case .complete:
            AppColor.green100
        case .pending:
            AppColor.gray100
        }
    }

    var textColor: Color {
        switch self {
        case .inProgress:
            AppColor.yellow700
        case .complete:
            AppColor.green700
        case .pending:
            AppColor.gray600
        }
    }

    var borderColor: Color {
        switch self {
        case .inProgress:
            AppColor.yellow400
        case .complete:
            AppColor.green400
        case .pending:
            AppColor.gray400
        }
    }
}

struct LearningMaterial: Identifiable, Hashable {
    let id: Int
    let name: String
    let problems: [Int]
    let pdfURL: URL
}

enum MockData {
    static let projects: [Project] = [
        Project(id: 1, title: "プロジェクト A", description: "重要なプロジェクトの詳細", status: .inProgress, date: "2026-04-15"),
        Project(id: 2, title: "プロジェクト B", description: "新しい機能の開発", status: .complete, date: "2026-04-10"),
        Project(id: 3, title: "プロジェクト C", description: "デザインレビュー", status: .inProgress, date: "2026-04-12"),
        Project(id: 4, title: "プロジェクト D", description: "パフォーマンス最適化", status: .pending, date: "2026-04-08"),
        Project(id: 5, title: "プロジェクト E", description: "ユーザーテスト実施", status: .inProgress, date: "2026-04-14")
    ]

    static let materials: [LearningMaterial] = [
        LearningMaterial(id: 1, name: "数学教材", problems: Array(1...10), pdfURL: dummyPDFURL),
        LearningMaterial(id: 2, name: "国語教材", problems: Array(1...8), pdfURL: dummyPDFURL),
        LearningMaterial(id: 3, name: "英語教材", problems: Array(1...12), pdfURL: dummyPDFURL),
        LearningMaterial(id: 4, name: "理科教材", problems: Array(1...5), pdfURL: dummyPDFURL)
    ]

    static func project(id: Int) -> Project {
        let letterIndex = min(max(id, 1), 26)
        let scalar = UnicodeScalar(64 + letterIndex)!

        return projects.first(where: { $0.id == id }) ?? Project(
            id: id,
            title: "プロジェクト \(String(scalar))",
            description: "プロジェクトの詳細説明",
            status: .inProgress,
            date: "2026-04-15"
        )
    }

    static func material(id: Int) -> LearningMaterial {
        materials.first(where: { $0.id == id }) ?? materials[0]
    }

    private static let dummyPDFURL = URL(string: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf")!
}
