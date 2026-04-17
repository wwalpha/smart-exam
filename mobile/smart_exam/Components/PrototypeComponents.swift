import SwiftUI

enum BackgroundStyle {
    case login
    case list
    case detail
    case pdfShell

    var gradient: LinearGradient {
        switch self {
        case .login:
            AppGradient.loginBackground
        case .list:
            AppGradient.listBackground
        case .detail:
            AppGradient.detailBackground
        case .pdfShell:
            AppGradient.pdfShellBackground
        }
    }

    var blobs: [AnimatedBlob.Configuration] {
        switch self {
        case .login:
            [
                .init(size: 600, alignment: .topTrailing, gradient: LinearGradient(colors: [AppColor.pink400.opacity(0.30), AppColor.purple500.opacity(0.20)], startPoint: .topLeading, endPoint: .bottomTrailing), delay: 0, duration: 8, startScale: 1, endScale: 1.2, startOpacity: 0.4, endOpacity: 0.6),
                .init(size: 500, alignment: .bottomLeading, gradient: LinearGradient(colors: [AppColor.cyan400.opacity(0.30), AppColor.blue400.opacity(0.20)], startPoint: .bottomLeading, endPoint: .topTrailing), delay: 0, duration: 10, startScale: 1.2, endScale: 1, startOpacity: 0.3, endOpacity: 0.5)
            ]
        case .list:
            [
                .init(size: 500, alignment: .topTrailing, gradient: LinearGradient(colors: [AppColor.yellow300.opacity(0.40), AppColor.orange300.opacity(0.30)], startPoint: .topLeading, endPoint: .bottomTrailing), delay: 0, duration: 8, startScale: 1, endScale: 1.1, startOpacity: 0.3, endOpacity: 0.5),
                .init(size: 500, alignment: .bottomLeading, gradient: LinearGradient(colors: [AppColor.pink300.opacity(0.40), AppColor.purple300.opacity(0.30)], startPoint: .topLeading, endPoint: .bottomTrailing), delay: 0, duration: 10, startScale: 1.1, endScale: 1, startOpacity: 0.3, endOpacity: 0.5)
            ]
        case .detail:
            [
                .init(size: 500, alignment: .topTrailing, gradient: LinearGradient(colors: [AppColor.blue300.opacity(0.40), AppColor.cyan300.opacity(0.30)], startPoint: .topLeading, endPoint: .bottomTrailing), delay: 0, duration: 8, startScale: 1, endScale: 1.1, startOpacity: 0.3, endOpacity: 0.5),
                .init(size: 500, alignment: .bottomLeading, gradient: LinearGradient(colors: [AppColor.pink300.opacity(0.40), AppColor.rose300.opacity(0.30)], startPoint: .topLeading, endPoint: .bottomTrailing), delay: 0, duration: 10, startScale: 1.1, endScale: 1, startOpacity: 0.3, endOpacity: 0.5)
            ]
        case .pdfShell:
            []
        }
    }
}

struct PrototypeBackground<Content: View>: View {
    let style: BackgroundStyle
    @ViewBuilder var content: Content

    var body: some View {
        ZStack {
            style.gradient
                .ignoresSafeArea()

            ForEach(Array(style.blobs.enumerated()), id: \.offset) { _, blob in
                AnimatedBlob(configuration: blob)
            }

            content
        }
    }
}

struct AnimatedBlob: View {
    struct Configuration {
        let size: CGFloat
        let alignment: Alignment
        let gradient: LinearGradient
        let delay: Double
        let duration: Double
        let startScale: CGFloat
        let endScale: CGFloat
        let startOpacity: Double
        let endOpacity: Double
    }

    let configuration: Configuration

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var animate = false

    var body: some View {
        Rectangle()
            .fill(Color.clear)
            .overlay(alignment: configuration.alignment) {
                Circle()
                    .fill(configuration.gradient)
                    .frame(width: configuration.size, height: configuration.size)
                    .blur(radius: 64)
                    .scaleEffect(animate ? configuration.endScale : configuration.startScale)
                    .opacity(animate ? configuration.endOpacity : configuration.startOpacity)
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(
                    .easeInOut(duration: configuration.duration)
                    .delay(configuration.delay)
                    .repeatForever(autoreverses: true)
                ) {
                    animate = true
                }
            }
    }
}

struct GlassCard<Content: View>: View {
    let cornerRadius: CGFloat
    let borderColor: Color
    let borderWidth: CGFloat
    let opacity: Double
    let shadow: AppShadow
    @ViewBuilder var content: Content

    var body: some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color.white.opacity(opacity))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(borderColor, lineWidth: borderWidth)
            )
            .appShadow(shadow)
    }
}

struct StatusChip: View {
    let status: ProjectStatus

    var body: some View {
        Text(status.rawValue)
            .font(AppFont.nunito(14, weight: .bold))
            .foregroundStyle(status.textColor)
            .padding(.horizontal, 12)
            .padding(.vertical, 4)
            .background(Capsule().fill(status.fillColor))
            .overlay(Capsule().stroke(status.borderColor, lineWidth: 2))
    }
}

struct ProblemChip: View {
    let number: Int

    var body: some View {
        Text("問\(number)")
            .font(AppFont.nunito(16, weight: .bold))
            .foregroundStyle(AppColor.blue700)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                    .fill(AppGradient.problemChip)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.control, style: .continuous)
                    .stroke(AppColor.blue300, lineWidth: 2)
            )
            .appShadow(.sm)
    }
}

struct PressScaleButtonStyle: ButtonStyle {
    let pressedScale: CGFloat

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? pressedScale : 1)
            .animation(.easeOut(duration: 0.16), value: configuration.isPressed)
    }
}

struct PrototypeBackButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                LucideIcon(kind: .arrowLeft, size: 20, color: AppColor.purple600)
                Text(title)
                    .font(AppFont.nunito(16, weight: .bold))
            }
            .foregroundStyle(AppColor.purple600)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Capsule().fill(Color.white.opacity(0.8)))
            .overlay(Capsule().stroke(AppColor.purple300, lineWidth: 2))
            .appShadow(.md)
        }
        .buttonStyle(PressScaleButtonStyle(pressedScale: 0.95))
        .hoverEffect(.lift)
    }
}
