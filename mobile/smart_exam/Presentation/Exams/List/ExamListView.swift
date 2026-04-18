import SwiftUI

struct ExamListView: View {
    @StateObject private var viewModel: ExamListViewModel
    let onSelectExam: (Exam) -> Void

    init(
        viewModel: ExamListViewModel,
        onSelectExam: @escaping (Exam) -> Void
    ) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.onSelectExam = onSelectExam
    }

    var body: some View {
        AppBackground(style: .list) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header

                    if viewModel.state.isLoading {
                        loadingView
                    } else if let errorMessage = viewModel.state.errorMessage {
                        messageCard(errorMessage)
                    } else if viewModel.state.exams.isEmpty {
                        messageCard("表示できる復習テストがありません")
                    } else {
                        VStack(spacing: 16) {
                            ForEach(viewModel.state.exams) { exam in
                                Button {
                                    onSelectExam(exam)
                                } label: {
                                    ExamCard(exam: exam)
                                }
                                .buttonStyle(PressScaleButtonStyle(pressedScale: 0.98))
                                .hoverEffect(.lift)
                            }
                        }
                    }
                }
                .frame(maxWidth: 900)
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

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("復習テスト")
                .font(AppFont.fredoka(48, weight: .bold))
                .foregroundStyle(AppColor.blue700)
        }
    }

    private var loadingView: some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: AppColor.blue200,
            borderWidth: 4,
            opacity: 0.86,
            shadow: .lg
        ) {
            HStack(spacing: 12) {
                ProgressView()
                Text("復習テストを読み込み中")
                    .font(AppFont.nunito(16, weight: .bold))
                    .foregroundStyle(AppColor.blue700)
            }
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func messageCard(_ message: String) -> some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: AppColor.blue200,
            borderWidth: 4,
            opacity: 0.86,
            shadow: .lg
        ) {
            Text(message)
                .font(AppFont.nunito(16, weight: .bold))
                .foregroundStyle(AppColor.gray600)
                .fixedSize(horizontal: false, vertical: true)
                .padding(24)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct ExamCard: View {
    let exam: Exam

    var body: some View {
        let palette = exam.subject.palette

        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: palette.border,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 0) {
                    Text(title)
                        .font(AppFont.fredoka(24, weight: .semibold))
                        .foregroundStyle(palette.text)
                        .padding(.bottom, 12)

                    FlowLayout(horizontalSpacing: 12, verticalSpacing: 10) {
                        InfoPill(title: "科目", value: exam.subject.label, palette: palette)
                        InfoPill(title: "作成日", value: formatDate(exam.createdDate), palette: palette)
                        InfoPill(title: "問題数", value: "\(exam.count)問", palette: palette)

                        if exam.status == .completed {
                            InfoPill(title: "正答", value: "\(exam.correctCount)/\(max(exam.results.count, exam.count))", palette: palette)
                        }

                        if let submittedDate = exam.submittedDate {
                            InfoPill(title: "提出日", value: formatDate(submittedDate), palette: palette)
                        }
                    }
                }

                Spacer(minLength: 12)

                VStack(alignment: .trailing, spacing: 12) {
                    ExamStatusChip(status: exam.status)

                    LucideIcon(kind: .moreVertical, size: 20, color: palette.accent)
                        .frame(width: 28, height: 28)
                }
            }
            .padding(24)
        }
    }

    private func formatDate(_ value: String) -> String {
        value.replacingOccurrences(of: "-", with: "/")
    }

    private var title: String {
        switch exam.mode {
        case .material:
            return exam.subject.label
        case .kanji:
            return "\(exam.subject.label) \(exam.mode.label)"
        }
    }
}

private struct InfoPill: View {
    let title: String
    let value: String
    let palette: SubjectPalette

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
