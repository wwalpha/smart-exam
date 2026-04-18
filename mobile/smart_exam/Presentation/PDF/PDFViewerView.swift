import SwiftUI

struct PDFViewerView: View {
    @StateObject private var viewModel: PDFViewerViewModel
    let onBack: () -> Void

    @State private var zoom = 175

    init(
        viewModel: PDFViewerViewModel,
        onBack: @escaping () -> Void
    ) {
        _viewModel = StateObject(wrappedValue: viewModel)
        self.onBack = onBack
    }

    var body: some View {
        VStack(spacing: 0) {
            header

            if viewModel.state.isLoading {
                loadingView
            } else if let errorMessage = viewModel.state.errorMessage {
                messageView(errorMessage)
            } else if let documentData = viewModel.state.documentData {
                viewerArea(documentData: documentData)
            } else {
                messageView("PDFを表示できません")
            }
        }
        .background(AppGradient.pdfShellBackground)
        .task {
            viewModel.load()
        }
        .highPriorityGesture(backSwipeGesture)
        .toolbar(.hidden, for: .navigationBar)
    }

    private var header: some View {
        HStack(spacing: 0) {
            HStack(spacing: 16) {
                Button(action: onBack) {
                    HStack(spacing: 8) {
                        LucideIcon(kind: .arrowLeft, size: 20, color: AppColor.blue600)
                        Text("戻る")
                            .font(AppFont.nunito(16, weight: .bold))
                    }
                    .foregroundStyle(AppColor.blue600)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(AppColor.blue100))
                    .overlay(Capsule().stroke(AppColor.blue300, lineWidth: 2))
                }
                .buttonStyle(PressScaleButtonStyle(pressedScale: 0.95))

                Rectangle()
                    .fill(AppColor.blue300)
                    .frame(width: 1, height: 24)

                Text(viewModel.state.descriptor?.title ?? viewModel.initialDescriptor.title)
                    .font(AppFont.fredoka(24, weight: .bold))
                    .foregroundStyle(AppColor.blue700)
            }

            Spacer(minLength: 24)

            zoomControl
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 10)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(AppColor.blue200)
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

    private var loadingView: some View {
        HStack(spacing: 12) {
            ProgressView()
            Text("PDFを読み込み中")
                .font(AppFont.nunito(16, weight: .bold))
                .foregroundStyle(AppColor.blue700)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(AppGradient.pdfShellBackground)
    }

    private func messageView(_ message: String) -> some View {
        Text(message)
            .font(AppFont.nunito(16, weight: .bold))
            .foregroundStyle(AppColor.blue700)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(AppGradient.pdfShellBackground)
    }

    private func viewerArea(documentData: Data) -> some View {
        PDFKitView(data: documentData, zoom: zoom)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.white)
    }

    private var backSwipeGesture: some Gesture {
        DragGesture(minimumDistance: 24, coordinateSpace: .local)
            .onEnded { value in
                guard value.startLocation.x < 64,
                      value.translation.width > 80,
                      abs(value.translation.height) < 70 else {
                    return
                }

                onBack()
            }
    }
}
