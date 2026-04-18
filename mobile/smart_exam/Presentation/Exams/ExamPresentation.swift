import SwiftUI

struct SubjectPalette {
    let fill: Color
    let border: Color
    let accent: Color
    let text: Color

    static let neutral = SubjectPalette(
        fill: AppColor.purple100,
        border: AppColor.purple200,
        accent: AppColor.purple500,
        text: AppColor.purple700
    )
}

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

extension SubjectId {
    var palette: SubjectPalette {
        switch self {
        case .japanese:
            return SubjectPalette(
                fill: AppColor.red100,
                border: AppColor.red300,
                accent: AppColor.red500,
                text: AppColor.red700
            )
        case .science:
            return SubjectPalette(
                fill: AppColor.green100,
                border: AppColor.green300,
                accent: AppColor.green500,
                text: AppColor.green700
            )
        case .society:
            return SubjectPalette(
                fill: AppColor.orange100,
                border: AppColor.orange300,
                accent: AppColor.orange500,
                text: AppColor.orange700
            )
        case .math:
            return SubjectPalette(
                fill: AppColor.blue100,
                border: AppColor.blue300,
                accent: AppColor.blue500,
                text: AppColor.blue700
            )
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
}

extension String {
    var nilIfBlank: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
