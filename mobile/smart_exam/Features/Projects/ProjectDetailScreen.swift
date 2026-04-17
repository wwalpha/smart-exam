import SwiftUI

struct ProjectDetailScreen: View {
    let projectId: String
    let onBack: () -> Void
    let onOpenPDF: (Int) -> Void

    @EnvironmentObject private var authService: AuthService

    @State private var detail: ReviewExamDetail?
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        PrototypeBackground(style: .detail) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    PrototypeBackButton(title: "戻る", action: onBack)
                        .padding(.bottom, 32)

                    if isLoading {
                        loadingView
                    } else if let errorMessage {
                        messageCard(errorMessage)
                    } else if let detail {
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
        .task(id: projectId) {
            await loadDetail()
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private var loadingView: some View {
        messageCard("詳細を読み込み中")
    }

    private func detailContent(_ detail: ReviewExamDetail) -> some View {
        VStack(alignment: .leading, spacing: 24) {
            header(detail)
            summaryCard(detail)

            if detail.mode == .material {
                materialQuestionList(detail.items)
            } else {
                kanjiQuestionList(detail.items)
            }
        }
    }

    private func header(_ detail: ReviewExamDetail) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("\(detail.subject.label) \(detail.mode.label)テスト")
                .font(AppFont.fredoka(60, weight: .bold))
                .foregroundStyle(AppColor.purple700)
                .minimumScaleFactor(0.72)
                .lineLimit(2)

            Text("ID: \(detail.examId)")
                .font(AppFont.nunito(18, weight: .semibold))
                .foregroundStyle(AppColor.purple600)
                .textSelection(.enabled)
        }
        .padding(.bottom, 16)
    }

    private func summaryCard(_ detail: ReviewExamDetail) -> some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: AppColor.purple200,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            VStack(alignment: .leading, spacing: 24) {
                HStack(alignment: .top, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("基本情報")
                            .font(AppFont.fredoka(30, weight: .bold))
                            .foregroundStyle(AppColor.purple700)

                        Text("API /api/exam/{examId} のレスポンス")
                            .font(AppFont.nunito(16, weight: .semibold))
                            .foregroundStyle(AppColor.purple600)
                    }

                    Spacer(minLength: 16)

                    ExamStatusChip(status: detail.status)
                }

                FlowLayout(horizontalSpacing: 12, verticalSpacing: 12) {
                    DetailPill(title: "科目", value: detail.subject.label)
                    DetailPill(title: "モード", value: detail.mode.label)
                    DetailPill(title: "作成日", value: formatDate(detail.createdDate))
                    DetailPill(title: "問題数", value: "\(detail.count)問")
                    DetailPill(title: "取得件数", value: "\(detail.items.count)問")

                    if detail.status == .completed {
                        DetailPill(title: "正答", value: "\(detail.correctCount)/\(max(detail.results.count, detail.count))")
                    }

                    if let submittedDate = detail.submittedDate {
                        DetailPill(title: "提出日", value: formatDate(submittedDate))
                    }
                }

                if !detail.pdf.url.isEmpty {
                    PDFLinkRow(url: detail.pdf.url)
                }
            }
            .padding(32)
        }
    }

    private func materialQuestionList(_ items: [ReviewExamItem]) -> some View {
        VStack(spacing: 24) {
            ForEach(materialGroups(from: items)) { group in
                MaterialQuestionCard(group: group)
            }
        }
    }

    private func kanjiQuestionList(_ items: [ReviewExamItem]) -> some View {
        VStack(spacing: 16) {
            ForEach(items) { item in
                KanjiQuestionCard(item: item)
            }
        }
    }

    private func messageCard(_ message: String) -> some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: AppColor.purple200,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            HStack(spacing: 12) {
                if isLoading {
                    ProgressView()
                }

                Text(message)
                    .font(AppFont.nunito(16, weight: .bold))
                    .foregroundStyle(AppColor.purple700)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @MainActor
    private func loadDetail() async {
        isLoading = true
        errorMessage = nil

        do {
            let accessToken = try await authService.validAccessToken()
            let response: ReviewExamDetail = try await APIClient.shared.getDecodable(
                path: "/api/exam/\(projectId)",
                accessToken: accessToken
            )
            detail = response
        } catch {
            detail = nil
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func materialGroups(from items: [ReviewExamItem]) -> [MaterialQuestionGroup] {
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

    private func formatDate(_ value: String) -> String {
        value.replacingOccurrences(of: "-", with: "/")
    }
}

private struct DetailPill: View {
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 6) {
            Text(title)
                .foregroundStyle(AppColor.gray500)
            Text(value)
                .foregroundStyle(AppColor.purple700)
        }
        .font(AppFont.nunito(14, weight: .bold))
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Capsule().fill(AppColor.purple100.opacity(0.8)))
        .overlay(Capsule().stroke(AppColor.purple200, lineWidth: 2))
    }
}

private struct PDFLinkRow: View {
    let url: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            LucideIcon(kind: .fileText, size: 20, color: AppColor.purple600)
                .padding(.top, 1)

            VStack(alignment: .leading, spacing: 4) {
                Text("PDF")
                    .font(AppFont.nunito(14, weight: .bold))
                    .foregroundStyle(AppColor.gray500)

                Text(url)
                    .font(AppFont.nunito(14, weight: .semibold))
                    .foregroundStyle(AppColor.purple700)
                    .lineLimit(2)
                    .textSelection(.enabled)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                .fill(AppColor.purple100.opacity(0.75))
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
    let items: [ReviewExamItem]

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

    var body: some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: AppColor.purple200,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            VStack(alignment: .leading, spacing: 20) {
                HStack(alignment: .top, spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(group.title)
                            .font(AppFont.fredoka(30, weight: .bold))
                            .foregroundStyle(AppColor.purple700)
                            .fixedSize(horizontal: false, vertical: true)

                        Text("全\(group.items.count)問")
                            .font(AppFont.nunito(16, weight: .semibold))
                            .foregroundStyle(AppColor.purple600)
                    }

                    Spacer(minLength: 12)
                }

                FlowLayout(horizontalSpacing: 10, verticalSpacing: 10) {
                    if let grade = group.grade?.nilIfBlank {
                        DetailPill(title: "学年", value: grade)
                    }

                    if let provider = group.provider?.nilIfBlank {
                        DetailPill(title: "提供元", value: provider)
                    }

                    if let materialDate = group.materialDate?.nilIfBlank {
                        DetailPill(title: "日付", value: materialDate)
                    }

                    if let materialId = group.materialId?.nilIfBlank {
                        DetailPill(title: "教材ID", value: materialId)
                    }
                }

                VStack(spacing: 12) {
                    ForEach(Array(group.items.enumerated()), id: \.element.id) { index, item in
                        MaterialQuestionRow(number: index + 1, item: item)
                    }
                }
            }
            .padding(32)
        }
    }
}

private struct MaterialQuestionRow: View {
    let number: Int
    let item: ReviewExamItem

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("問\(number)")
                .font(AppFont.nunito(14, weight: .bold))
                .foregroundStyle(AppColor.blue700)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                        .fill(AppGradient.problemChip)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                        .stroke(AppColor.blue300, lineWidth: 2)
                )

            VStack(alignment: .leading, spacing: 6) {
                Text(item.displayTitle)
                    .font(AppFont.nunito(16, weight: .bold))
                    .foregroundStyle(AppColor.purple700)
                    .fixedSize(horizontal: false, vertical: true)

                Text(item.answerTitle)
                    .font(AppFont.nunito(15, weight: .semibold))
                    .foregroundStyle(AppColor.gray600)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 8)

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
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                .fill(Color.white.opacity(0.72))
        )
    }
}

private struct KanjiQuestionCard: View {
    let item: ReviewExamItem

    var body: some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: AppColor.purple200,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            VStack(alignment: .leading, spacing: 16) {
                Text(item.questionText?.nilIfBlank ?? "漢字問題")
                    .font(AppFont.fredoka(26, weight: .bold))
                    .foregroundStyle(AppColor.purple700)
                    .fixedSize(horizontal: false, vertical: true)

                FlowLayout(horizontalSpacing: 10, verticalSpacing: 10) {
                    if let kanji = item.kanji?.nilIfBlank {
                        DetailPill(title: "漢字", value: kanji)
                    }

                    if let reading = item.readingHiragana?.nilIfBlank {
                        DetailPill(title: "読み", value: reading)
                    }

                    if let answer = item.answerText?.nilIfBlank {
                        DetailPill(title: "答え", value: answer)
                    }
                }
            }
            .padding(24)
        }
    }
}

private extension ReviewExamItem {
    var displayTitle: String {
        canonicalKey?.nilIfBlank ?? displayLabel?.nilIfBlank ?? questionText?.nilIfBlank ?? "問題"
    }

    var answerTitle: String {
        answerText?.nilIfBlank ?? correctAnswer?.nilIfBlank ?? "答え未設定"
    }
}

private extension String {
    var nilIfBlank: String? {
        let trimmed = trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

struct FlowLayout: Layout {
    let horizontalSpacing: CGFloat
    let verticalSpacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? 0
        var rows: [Row] = []
        var currentRow = Row()

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentRow.width + size.width + (currentRow.isEmpty ? 0 : horizontalSpacing) > width, !currentRow.isEmpty {
                rows.append(currentRow)
                currentRow = Row()
            }

            currentRow.add(size: size, spacing: horizontalSpacing)
        }

        if !currentRow.isEmpty {
            rows.append(currentRow)
        }

        let totalHeight = rows.reduce(CGFloat.zero) { partial, row in
            partial + row.height
        } + CGFloat(max(0, rows.count - 1)) * verticalSpacing

        return CGSize(width: width, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + verticalSpacing
                rowHeight = 0
            }

            subview.place(
                at: CGPoint(x: x, y: y),
                proposal: ProposedViewSize(width: size.width, height: size.height)
            )
            x += size.width + horizontalSpacing
            rowHeight = max(rowHeight, size.height)
        }
    }

    private struct Row {
        var width: CGFloat = 0
        var height: CGFloat = 0

        var isEmpty: Bool {
            width == 0 && height == 0
        }

        mutating func add(size: CGSize, spacing: CGFloat) {
            width += (isEmpty ? 0 : spacing) + size.width
            height = max(height, size.height)
        }
    }
}

#Preview {
    ProjectDetailScreen(projectId: "1", onBack: {}, onOpenPDF: { _ in })
        .environmentObject(AuthService())
}
