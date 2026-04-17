import SwiftUI

struct ProjectDetailScreen: View {
    let projectId: Int
    let onBack: () -> Void
    let onOpenPDF: (Int) -> Void

    private var project: Project {
        MockData.project(id: projectId)
    }

    var body: some View {
        PrototypeBackground(style: .detail) {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    PrototypeBackButton(title: "戻る", action: onBack)
                        .padding(.bottom, 32)

                    VStack(alignment: .leading, spacing: 12) {
                        Text(project.title)
                            .font(AppFont.fredoka(60, weight: .bold))
                            .foregroundStyle(AppColor.purple700)

                        Text("プロジェクトの詳細説明")
                            .font(AppFont.nunito(18, weight: .semibold))
                            .foregroundStyle(AppColor.purple600)
                    }
                    .padding(.bottom, 48)

                    VStack(spacing: 24) {
                        ForEach(MockData.materials) { material in
                            MaterialCard(material: material) {
                                onOpenPDF(material.id)
                            }
                        }
                    }
                }
                .frame(maxWidth: 900, alignment: .leading)
                .padding(.horizontal, AppSpacing.page)
                .padding(.vertical, AppSpacing.page)
                .frame(maxWidth: .infinity)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

private struct MaterialCard: View {
    let material: LearningMaterial
    let onOpenPDF: () -> Void

    var body: some View {
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
                        Text(material.name)
                            .font(AppFont.fredoka(30, weight: .bold))
                            .foregroundStyle(AppColor.purple700)

                        Text("全\(material.problems.count)問")
                            .font(AppFont.nunito(16, weight: .semibold))
                            .foregroundStyle(AppColor.purple600)
                    }

                    Spacer(minLength: 16)

                    Button(action: onOpenPDF) {
                        HStack(spacing: 8) {
                            LucideIcon(kind: .fileText, size: 20, color: .white)
                            Text("PDF表示")
                                .font(AppFont.fredoka(16, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(
                            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                                .fill(AppGradient.pdfButton)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                                .stroke(Color.white.opacity(0.5), lineWidth: 4)
                        )
                        .appShadow(.lg)
                    }
                    .buttonStyle(PressScaleButtonStyle(pressedScale: 0.95))
                    .hoverEffect(.lift)
                }

                FlowLayout(horizontalSpacing: 12, verticalSpacing: 12) {
                    ForEach(material.problems, id: \.self) { problem in
                        ProblemChip(number: problem)
                    }
                }
            }
            .padding(32)
        }
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
    ProjectDetailScreen(projectId: 1, onBack: {}, onOpenPDF: { _ in })
}
