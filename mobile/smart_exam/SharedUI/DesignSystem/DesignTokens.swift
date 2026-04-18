import SwiftUI

enum AppColor {
    static let loginStart = Color(hex: 0xFEF3C7)
    static let loginMiddle = Color(hex: 0xFDE68A)
    static let loginEnd = Color(hex: 0xFCD34D)

    static let listStart = Color(hex: 0xDBEAFE)
    static let listMiddle = Color(hex: 0xBFDBFE)
    static let listEnd = Color(hex: 0x93C5FD)

    static let detailStart = Color(hex: 0xFAE8FF)
    static let detailMiddle = Color(hex: 0xF3E8FF)
    static let detailEnd = Color(hex: 0xE9D5FF)

    static let purple100 = Color(hex: 0xF3E8FF)
    static let purple200 = Color(hex: 0xE9D5FF)
    static let purple300 = Color(hex: 0xD8B4FE)
    static let purple500 = Color(hex: 0xA855F7)
    static let purple600 = Color(hex: 0x9333EA)
    static let purple700 = Color(hex: 0x7E22CE)

    static let blue100 = Color(hex: 0xDBEAFE)
    static let blue200 = Color(hex: 0xBFDBFE)
    static let blue300 = Color(hex: 0x93C5FD)
    static let blue400 = Color(hex: 0x60A5FA)
    static let blue500 = Color(hex: 0x3B82F6)
    static let blue600 = Color(hex: 0x2563EB)
    static let blue700 = Color(hex: 0x1D4ED8)
    static let blue800 = Color(hex: 0x1E40AF)

    static let cyan100 = Color(hex: 0xCFFAFE)
    static let cyan300 = Color(hex: 0x67E8F9)
    static let cyan400 = Color(hex: 0x22D3EE)

    static let green100 = Color(hex: 0xDCFCE7)
    static let green200 = Color(hex: 0xBBF7D0)
    static let green300 = Color(hex: 0x86EFAC)
    static let green400 = Color(hex: 0x4ADE80)
    static let green500 = Color(hex: 0x22C55E)
    static let green600 = Color(hex: 0x16A34A)
    static let green700 = Color(hex: 0x15803D)

    static let emerald400 = Color(hex: 0x34D399)
    static let emerald500 = Color(hex: 0x10B981)

    static let red100 = Color(hex: 0xFEE2E2)
    static let red200 = Color(hex: 0xFECACA)
    static let red300 = Color(hex: 0xFCA5A5)
    static let red500 = Color(hex: 0xEF4444)
    static let red700 = Color(hex: 0xB91C1C)

    static let pink100 = Color(hex: 0xFCE7F3)
    static let pink200 = Color(hex: 0xFBCFE8)
    static let pink300 = Color(hex: 0xF9A8D4)
    static let pink400 = Color(hex: 0xF472B6)
    static let pink500 = Color(hex: 0xEC4899)
    static let pink600 = Color(hex: 0xDB2777)

    static let rose300 = Color(hex: 0xFDA4AF)
    static let indigo500 = Color(hex: 0x6366F1)
    static let yellow100 = Color(hex: 0xFEF9C3)
    static let yellow300 = Color(hex: 0xFDE047)
    static let yellow400 = Color(hex: 0xFACC15)
    static let yellow700 = Color(hex: 0xA16207)
    static let orange100 = Color(hex: 0xFFEDD5)
    static let orange200 = Color(hex: 0xFED7AA)
    static let orange300 = Color(hex: 0xFDBA74)
    static let orange500 = Color(hex: 0xF97316)
    static let orange700 = Color(hex: 0xC2410C)

    static let gray100 = Color(hex: 0xF3F4F6)
    static let gray400 = Color(hex: 0x9CA3AF)
    static let gray500 = Color(hex: 0x6B7280)
    static let gray600 = Color(hex: 0x4B5563)
    static let gray800 = Color(hex: 0x1F2937)
}

enum AppGradient {
    static let loginBackground = LinearGradient(
        colors: [AppColor.loginStart, AppColor.loginMiddle, AppColor.loginEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let listBackground = LinearGradient(
        colors: [AppColor.listStart, AppColor.listMiddle, AppColor.listEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let detailBackground = LinearGradient(
        colors: [AppColor.detailStart, AppColor.detailMiddle, AppColor.detailEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let pdfShellBackground = LinearGradient(
        colors: [AppColor.listStart, AppColor.listMiddle],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let pdfViewerBackground = LinearGradient(
        colors: [AppColor.purple100, AppColor.pink100],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let loginButton = LinearGradient(
        colors: [AppColor.pink500, AppColor.purple500, AppColor.indigo500],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let loginButtonReverse = LinearGradient(
        colors: [AppColor.indigo500, AppColor.purple500, AppColor.pink500],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let pdfButton = LinearGradient(
        colors: [AppColor.green400, AppColor.emerald500],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let problemChip = LinearGradient(
        colors: [AppColor.blue100, AppColor.cyan100],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

enum AppFont {
    static func fredoka(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Fredoka", size: size).weight(weight)
    }

    static func nunito(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Nunito", size: size).weight(weight)
    }
}

enum AppRadius {
    static let card: CGFloat = 24
    static let control: CGFloat = 16
    static let paper: CGFloat = 8
}

enum AppSpacing {
    static let page: CGFloat = 48
    static let pdfPage: CGFloat = 32
    static let listGap: CGFloat = 16
    static let sectionGap: CGFloat = 24
}

extension View {
    func appShadow(_ style: AppShadow) -> some View {
        shadow(color: style.color, radius: style.radius, x: style.x, y: style.y)
    }
}

struct AppShadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat

    static let sm = AppShadow(color: .black.opacity(0.12), radius: 2, x: 0, y: 1)
    static let md = AppShadow(color: .black.opacity(0.16), radius: 6, x: 0, y: 3)
    static let lg = AppShadow(color: .black.opacity(0.18), radius: 10, x: 0, y: 6)
    static let xl = AppShadow(color: .black.opacity(0.22), radius: 16, x: 0, y: 10)
    static let xxl = AppShadow(color: .black.opacity(0.28), radius: 24, x: 0, y: 14)
}

extension Color {
    init(hex: UInt, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 8) & 0xff) / 255,
            blue: Double(hex & 0xff) / 255,
            opacity: opacity
        )
    }
}
