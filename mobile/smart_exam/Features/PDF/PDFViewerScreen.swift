import SwiftUI

struct PDFViewerScreen: View {
    let projectId: Int
    let materialId: Int
    let onBack: () -> Void
    private let pdfSourceProvider: any PDFSourceProviding

    @State private var zoom = 100

    init(
        projectId: Int,
        materialId: Int,
        pdfSourceProvider: any PDFSourceProviding = MockRemotePDFSourceProvider(),
        onBack: @escaping () -> Void
    ) {
        self.projectId = projectId
        self.materialId = materialId
        self.pdfSourceProvider = pdfSourceProvider
        self.onBack = onBack
    }

    private var material: LearningMaterial {
        MockData.material(id: materialId)
    }

    private var pdfURL: URL {
        pdfSourceProvider.pdfURL(projectId: projectId, materialId: materialId)
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            viewerArea
        }
        .background(AppGradient.pdfShellBackground)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var header: some View {
        HStack(spacing: 0) {
            HStack(spacing: 16) {
                Button(action: onBack) {
                    HStack(spacing: 8) {
                        LucideIcon(kind: .arrowLeft, size: 20, color: AppColor.purple600)
                        Text("戻る")
                            .font(AppFont.nunito(16, weight: .bold))
                    }
                    .foregroundStyle(AppColor.purple600)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(AppColor.purple100))
                    .overlay(Capsule().stroke(AppColor.purple300, lineWidth: 2))
                }
                .buttonStyle(PressScaleButtonStyle(pressedScale: 0.95))

                Rectangle()
                    .fill(AppColor.purple300)
                    .frame(width: 1, height: 24)

                Text(material.name)
                    .font(AppFont.fredoka(24, weight: .bold))
                    .foregroundStyle(AppColor.purple700)
            }

            Spacer(minLength: 24)

            HStack(spacing: 12) {
                zoomControl

                IconPillButton(
                    kind: .share2,
                    fill: AppColor.green100,
                    hoverFill: AppColor.green200,
                    border: AppColor.green300,
                    tint: AppColor.green600
                ) {}

                IconPillButton(
                    kind: .download,
                    fill: AppColor.pink100,
                    hoverFill: AppColor.pink200,
                    border: AppColor.pink300,
                    tint: AppColor.pink600
                ) {}
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 16)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(AppColor.purple200)
                .frame(height: 4)
        }
        .appShadow(.md)
    }

    private var zoomControl: some View {
        HStack(spacing: 8) {
            Button {
                zoom = max(zoom - 25, 50)
            } label: {
                LucideIcon(kind: .zoomOut, size: 20, color: zoom <= 50 ? AppColor.blue300 : AppColor.blue600)
            }
            .disabled(zoom <= 50)
            .buttonStyle(PressScaleButtonStyle(pressedScale: 0.90))

            Text("\(zoom)%")
                .font(AppFont.nunito(14, weight: .bold))
                .foregroundStyle(AppColor.blue700)
                .frame(minWidth: 50)

            Button {
                zoom = min(zoom + 25, 200)
            } label: {
                LucideIcon(kind: .zoomIn, size: 20, color: zoom >= 200 ? AppColor.blue300 : AppColor.blue600)
            }
            .disabled(zoom >= 200)
            .buttonStyle(PressScaleButtonStyle(pressedScale: 0.90))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                .fill(AppColor.blue100)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                .stroke(AppColor.blue300, lineWidth: 2)
        )
    }

    private var viewerArea: some View {
        ScrollView([.vertical, .horizontal]) {
            PDFKitView(url: pdfURL, zoom: zoom)
                .frame(width: 800, height: 1200)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: AppRadius.paper, style: .continuous))
                .appShadow(.xxl)
                .padding(.top, 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .contentMargins(AppSpacing.pdfPage, for: .scrollContent)
        .background(AppGradient.pdfViewerBackground)
    }
}

private struct IconPillButton: View {
    let kind: LucideIcon.Kind
    let fill: Color
    let hoverFill: Color
    let border: Color
    let tint: Color
    let action: () -> Void

    @State private var hovering = false

    var body: some View {
        Button(action: action) {
            LucideIcon(kind: kind, size: 20, color: tint)
                .frame(width: 20, height: 20)
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                        .fill(hovering ? hoverFill : fill)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                        .stroke(border, lineWidth: 2)
                )
        }
        .buttonStyle(PressScaleButtonStyle(pressedScale: 0.95))
        .onHover { hovering = $0 }
    }
}

#Preview {
    PDFViewerScreen(projectId: 1, materialId: 1, onBack: {})
}
