import Foundation
import SwiftUI

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
