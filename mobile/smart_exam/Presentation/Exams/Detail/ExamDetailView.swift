import SwiftUI

struct ExamDetailView: View {
    @StateObject private var viewModel: ExamDetailViewModel
    let onBack: () -> Void
    let onOpenPDF: (PDFDocumentDescriptor) -> Void
    private let detailPalette = SubjectPalette(
        fill: AppColor.blue100,
        border: AppColor.blue200,
        accent: AppColor.blue500,
        text: AppColor.blue700
    )

    init(
        viewModel: ExamDetailViewModel,
        onBack: @escaping () -> Void,
        onOpenPDF: @escaping (PDFDocumentDescriptor) -> Void
    ) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.onBack = onBack
        self.onOpenPDF = onOpenPDF
    }

    var body: some View {
        AppBackground(style: .list) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    BackButton(title: "戻る", action: onBack)
                        .padding(.bottom, 32)

                    if viewModel.state.isLoading {
                        messageCard("詳細を読み込み中", showsProgress: true)
                    } else if let errorMessage = viewModel.state.errorMessage {
                        messageCard(errorMessage)
                    } else if let detail = viewModel.state.detail {
                        detailContent(detail)
                    } else {
                        messageCard("詳細データがありません")
                    }
                }
                .frame(maxWidth: 900, alignment: .leading)
                .padding(.horizontal, AppSpacing.page)
                .padding(.vertical, AppSpacing.page)
                .frame(maxWidth: .infinity)
            }
        }
        .task {
            viewModel.load()
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private func detailContent(_ detail: ExamDetail) -> some View {
        VStack(alignment: .leading, spacing: 24) {
            summaryCard(detail)

            if detail.mode == .material {
                materialQuestionList(detail)
            } else {
                kanjiQuestionList(detail)
            }
        }
    }

    private func summaryCard(_ detail: ExamDetail) -> some View {
        return GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: detailPalette.border,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            VStack(alignment: .leading, spacing: 24) {
                HStack(alignment: .top, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("基本情報")
                            .font(AppFont.fredoka(30, weight: .bold))
                            .foregroundStyle(detailPalette.text)
                    }

                    Spacer(minLength: 16)

                    ExamStatusChip(status: detail.status)
                }

                FlowLayout(horizontalSpacing: 12, verticalSpacing: 12) {
                    DetailPill(title: "科目", value: detail.subject.label, palette: detailPalette)
                    DetailPill(title: "モード", value: detail.mode.label, palette: detailPalette)
                    DetailPill(title: "作成日", value: formatDate(detail.createdDate), palette: detailPalette)
                    DetailPill(title: "問題数", value: "\(detail.count)問", palette: detailPalette)
                    DetailPill(title: "取得件数", value: "\(detail.items.count)問", palette: detailPalette)

                    if detail.status == .completed {
                        DetailPill(title: "正答", value: "\(detail.correctCount)/\(max(detail.results.count, detail.count))", palette: detailPalette)
                    }

                    if let submittedDate = detail.submittedDate {
                        DetailPill(title: "提出日", value: formatDate(submittedDate), palette: detailPalette)
                    }
                }
            }
            .padding(32)
        }
    }

    private func materialQuestionList(_ detail: ExamDetail) -> some View {
        VStack(spacing: 24) {
            ForEach(materialGroups(from: detail.items)) { group in
                MaterialQuestionCard(
                    group: group,
                    palette: detailPalette,
                    pdfDescriptor: pdfDescriptor(for: group, availability: viewModel.state.materialQuestionPDFAvailability),
                    onOpenPDF: onOpenPDF
                )
            }
        }
    }

    private func kanjiQuestionList(_ detail: ExamDetail) -> some View {
        VStack(spacing: 16) {
            ForEach(detail.items) { item in
                KanjiQuestionCard(item: item, palette: detailPalette)
            }
        }
    }

    private func messageCard(_ message: String, showsProgress: Bool = false) -> some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: detailPalette.border,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            HStack(spacing: 12) {
                if showsProgress {
                    ProgressView()
                }

                Text(message)
                    .font(AppFont.nunito(16, weight: .bold))
                    .foregroundStyle(detailPalette.text)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func materialGroups(from items: [ExamItem]) -> [MaterialQuestionGroup] {
        let groupedItems = Dictionary(grouping: items) { item in
            [
                item.materialId,
                item.grade,
                item.provider,
                item.materialDate,
                item.materialName
            ]
            .compactMap { $0?.nilIfBlank }
            .joined(separator: "|")
        }

        return groupedItems.map { key, groupItems in
            let firstItem = groupItems.first
            return MaterialQuestionGroup(
                id: key.isEmpty ? UUID().uuidString : key,
                materialId: firstItem?.materialId,
                grade: firstItem?.grade,
                provider: firstItem?.provider,
                materialName: firstItem?.materialName,
                materialDate: firstItem?.materialDate,
                items: groupItems.sorted { lhs, rhs in
                    (lhs.canonicalKey ?? lhs.displayLabel ?? lhs.id) < (rhs.canonicalKey ?? rhs.displayLabel ?? rhs.id)
                }
            )
        }
        .sorted { lhs, rhs in
            lhs.sortTitle < rhs.sortTitle
        }
    }

    private func pdfDescriptor(
        for group: MaterialQuestionGroup,
        availability: [String: Bool]
    ) -> PDFDocumentDescriptor? {
        guard let materialId = group.materialId?.nilIfBlank else {
            return nil
        }
        guard availability[materialId] == true else {
            return nil
        }

        return PDFDocumentDescriptor(
            id: "\(materialId)-question-pdf",
            title: "\(group.title) 問題PDF",
            sourceType: .materialFile,
            materialId: materialId,
            materialFileType: .question
        )
    }

    private func formatDate(_ value: String) -> String {
        value.replacingOccurrences(of: "-", with: "/")
    }
}

private struct DetailPill: View {
    let title: String
    let value: String
    let palette: SubjectPalette

    init(title: String, value: String, palette: SubjectPalette = .neutral) {
        self.title = title
        self.value = value
        self.palette = palette
    }

    var body: some View {
        HStack(spacing: 6) {
            Text(title)
                .foregroundStyle(AppColor.gray500)
            Text(value)
                .foregroundStyle(palette.text)
        }
        .font(AppFont.nunito(14, weight: .bold))
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Capsule().fill(palette.fill.opacity(0.8)))
        .overlay(Capsule().stroke(palette.border, lineWidth: 2))
    }
}

private struct PDFButtonLabel: View {
    let palette: SubjectPalette
    let isEnabled: Bool

    init(palette: SubjectPalette, isEnabled: Bool = true) {
        self.palette = palette
        self.isEnabled = isEnabled
    }

    var body: some View {
        HStack(spacing: 10) {
            LucideIcon(kind: .fileText, size: 18, color: isEnabled ? .white : AppColor.gray500)

            Text("問題PDF")
                .font(AppFont.nunito(15, weight: .bold))
                .foregroundStyle(isEnabled ? .white : AppColor.gray500)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                .fill(isEnabled ? palette.accent : AppColor.gray100)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                .stroke(isEnabled ? palette.accent : AppColor.gray400, lineWidth: 2)
        )
    }
}

private struct MaterialQuestionGroup: Identifiable {
    let id: String
    let materialId: String?
    let grade: String?
    let provider: String?
    let materialName: String?
    let materialDate: String?
    let items: [ExamItem]

    var title: String {
        materialName?.nilIfBlank ?? materialId?.nilIfBlank ?? "教材"
    }

    var sortTitle: String {
        [
            materialDate?.nilIfBlank,
            provider?.nilIfBlank,
            materialName?.nilIfBlank,
            materialId?.nilIfBlank
        ]
        .compactMap(\.self)
        .joined(separator: " ")
    }
}

private struct MaterialQuestionCard: View {
    let group: MaterialQuestionGroup
    let palette: SubjectPalette
    let pdfDescriptor: PDFDocumentDescriptor?
    let onOpenPDF: (PDFDocumentDescriptor) -> Void

    private let columns = Array(
        repeating: GridItem(.flexible(minimum: 0), spacing: 12, alignment: .top),
        count: 3
    )

    var body: some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: palette.border,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            VStack(alignment: .leading, spacing: 20) {
                HStack(alignment: .top, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(group.title)
                            .font(AppFont.fredoka(30, weight: .bold))
                            .foregroundStyle(palette.text)
                            .fixedSize(horizontal: false, vertical: true)

                        Text("全\(group.items.count)問")
                            .font(AppFont.nunito(16, weight: .semibold))
                            .foregroundStyle(palette.text.opacity(0.82))
                    }

                    Spacer(minLength: 12)

                    Button {
                        if let pdfDescriptor {
                            onOpenPDF(pdfDescriptor)
                        }
                    } label: {
                        PDFButtonLabel(palette: palette, isEnabled: pdfDescriptor != nil)
                    }
                    .disabled(pdfDescriptor == nil)
                    .buttonStyle(PressScaleButtonStyle(pressedScale: 0.98))
                }

                FlowLayout(horizontalSpacing: 10, verticalSpacing: 10) {
                    if let grade = group.grade?.nilIfBlank {
                        DetailPill(title: "学年", value: grade, palette: palette)
                    }

                    if let provider = group.provider?.nilIfBlank {
                        DetailPill(title: "提供元", value: provider, palette: palette)
                    }

                    if let materialDate = group.materialDate?.nilIfBlank {
                        DetailPill(title: "日付", value: materialDate, palette: palette)
                    }
                }

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(Array(group.items.enumerated()), id: \.element.id) { index, item in
                        MaterialQuestionRow(number: index + 1, item: item, palette: palette)
                    }
                }
            }
            .padding(32)
        }
    }
}

private struct MaterialQuestionRow: View {
    let number: Int
    let item: ExamItem
    let palette: SubjectPalette

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            Text("問\(number)")
                .font(AppFont.nunito(14, weight: .bold))
                .foregroundStyle(palette.text)
                .padding(.horizontal, 9)
                .padding(.vertical, 5)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                        .fill(palette.fill)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                        .stroke(palette.border, lineWidth: 2)
                )

            Text(item.displayTitle)
                .font(AppFont.nunito(16, weight: .bold))
                .foregroundStyle(palette.text)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 4)

            if let isCorrect = item.isCorrect {
                Text(isCorrect ? "正解" : "未正解")
                    .font(AppFont.nunito(13, weight: .bold))
                    .foregroundStyle(isCorrect ? AppColor.green700 : AppColor.yellow700)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(isCorrect ? AppColor.green100 : AppColor.yellow100))
                    .overlay(Capsule().stroke(isCorrect ? AppColor.green400 : AppColor.yellow400, lineWidth: 2))
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, minHeight: 54, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
    }
}

private struct KanjiQuestionCard: View {
    let item: ExamItem
    let palette: SubjectPalette

    var body: some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: palette.border,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            VStack(alignment: .leading, spacing: 16) {
                Text(item.questionText?.nilIfBlank ?? "漢字問題")
                    .font(AppFont.fredoka(26, weight: .bold))
                    .foregroundStyle(palette.text)
                    .fixedSize(horizontal: false, vertical: true)

                FlowLayout(horizontalSpacing: 10, verticalSpacing: 10) {
                    if let kanji = item.kanji?.nilIfBlank {
                        DetailPill(title: "漢字", value: kanji, palette: palette)
                    }

                    if let reading = item.readingHiragana?.nilIfBlank {
                        DetailPill(title: "読み", value: reading, palette: palette)
                    }
                }
            }
            .padding(24)
        }
    }
}
