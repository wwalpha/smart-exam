import SwiftUI

struct ProjectListScreen: View {
    let onSelectExam: (ReviewExam) -> Void

    @EnvironmentObject private var authService: AuthService

    @State private var exams: [ReviewExam] = []
    @State private var total = 0
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        PrototypeBackground(style: .list) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header

                    if isLoading {
                        loadingView
                    } else if let errorMessage {
                        errorView(errorMessage)
                    } else if exams.isEmpty {
                        emptyView
                    } else {
                        VStack(spacing: 16) {
                            ForEach(exams) { exam in
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
            await loadExams()
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("復習テスト")
                .font(AppFont.fredoka(48, weight: .bold))
                .foregroundStyle(AppColor.blue700)

            Text("API /api/exam/search の検索結果 \(total)件")
                .font(AppFont.nunito(16, weight: .semibold))
                .foregroundStyle(AppColor.blue600)
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

    private var emptyView: some View {
        messageCard("表示できる復習テストがありません")
    }

    private func errorView(_ message: String) -> some View {
        messageCard(message)
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

    @MainActor
    private func loadExams() async {
        isLoading = true
        errorMessage = nil

        do {
            let accessToken = try await authService.validAccessToken()
            let response: ExamListResponse = try await APIClient.shared.postJSON(
                path: "/api/exam/search",
                body: SearchExamsRequest(mode: .material, status: "ALL", limit: 50),
                accessToken: accessToken
            )
            exams = response.items
            total = response.total
        } catch {
            exams = []
            total = 0
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct ExamCard: View {
    let exam: ReviewExam

    var body: some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: AppColor.blue200,
            borderWidth: 4,
            opacity: 0.90,
            shadow: .lg
        ) {
            HStack(alignment: .top, spacing: 16) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("\(exam.subject.label) \(exam.mode.label)テスト")
                        .font(AppFont.fredoka(24, weight: .semibold))
                        .foregroundStyle(AppColor.blue700)
                        .padding(.bottom, 8)

                    Text("ID: \(exam.examId)")
                        .font(AppFont.nunito(16, weight: .semibold))
                        .foregroundStyle(AppColor.gray600)
                        .padding(.bottom, 12)

                    FlowLayout(horizontalSpacing: 12, verticalSpacing: 10) {
                        InfoPill(title: "科目", value: exam.subject.label)
                        InfoPill(title: "作成日", value: formatDate(exam.createdDate))
                        InfoPill(title: "問題数", value: "\(exam.count)問")

                        if exam.status == .completed {
                            InfoPill(title: "正答", value: "\(exam.correctCount)/\(max(exam.results.count, exam.count))")
                        }

                        if let submittedDate = exam.submittedDate {
                            InfoPill(title: "提出日", value: formatDate(submittedDate))
                        }
                    }
                }

                Spacer(minLength: 12)

                VStack(alignment: .trailing, spacing: 12) {
                    ExamStatusChip(status: exam.status)

                    LucideIcon(kind: .moreVertical, size: 20, color: AppColor.blue400)
                        .frame(width: 28, height: 28)
                }
            }
            .padding(24)
        }
    }

    private func formatDate(_ value: String) -> String {
        value.replacingOccurrences(of: "-", with: "/")
    }
}

private struct InfoPill: View {
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 6) {
            Text(title)
                .foregroundStyle(AppColor.gray500)
            Text(value)
                .foregroundStyle(AppColor.blue700)
        }
        .font(AppFont.nunito(14, weight: .bold))
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Capsule().fill(AppColor.blue100.opacity(0.8)))
        .overlay(Capsule().stroke(AppColor.blue200, lineWidth: 2))
    }
}

#Preview {
    ProjectListScreen { _ in }
        .environmentObject(AuthService())
}
