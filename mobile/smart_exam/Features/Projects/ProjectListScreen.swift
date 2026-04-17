import SwiftUI

struct ProjectListScreen: View {
    let onSelectProject: (Project) -> Void

    private let projects = MockData.projects

    var body: some View {
        PrototypeBackground(style: .list) {
            ScrollView {
                VStack(spacing: 16) {
                    ForEach(projects) { project in
                        Button {
                            onSelectProject(project)
                        } label: {
                            ProjectCard(project: project)
                        }
                        .buttonStyle(PressScaleButtonStyle(pressedScale: 0.98))
                        .hoverEffect(.lift)
                    }
                }
                .frame(maxWidth: 900)
                .padding(.horizontal, AppSpacing.page)
                .padding(.vertical, AppSpacing.page)
                .frame(maxWidth: .infinity)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

private struct ProjectCard: View {
    let project: Project

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
                    Text(project.title)
                        .font(AppFont.fredoka(24, weight: .semibold))
                        .foregroundStyle(AppColor.blue700)
                        .padding(.bottom, 8)

                    Text(project.description)
                        .font(AppFont.nunito(16, weight: .semibold))
                        .foregroundStyle(AppColor.gray600)
                        .padding(.bottom, 12)

                    HStack(spacing: 16) {
                        StatusChip(status: project.status)

                        Text(project.date)
                            .font(AppFont.nunito(14, weight: .semibold))
                            .foregroundStyle(AppColor.gray500)
                    }
                }

                Spacer(minLength: 12)

                LucideIcon(kind: .moreVertical, size: 20, color: AppColor.blue400)
                    .frame(width: 28, height: 28)
            }
            .padding(24)
        }
    }
}

#Preview {
    ProjectListScreen { _ in }
}
