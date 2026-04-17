import SwiftUI

extension ExamMode {
    var label: String {
        switch self {
        case .material:
            return "問題"
        case .kanji:
            return "漢字"
        }
    }
}

extension SubjectId {
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

extension ExamStatus {
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

extension ExamItem {
    var displayTitle: String {
        canonicalKey?.nilIfBlank ?? displayLabel?.nilIfBlank ?? questionText?.nilIfBlank ?? "問題"
    }

    var answerTitle: String {
        answerText?.nilIfBlank ?? correctAnswer?.nilIfBlank ?? "答え未設定"
    }
}

extension String {
    var nilIfBlank: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
