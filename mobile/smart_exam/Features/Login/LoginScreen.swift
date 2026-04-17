import SwiftUI

struct LoginScreen: View {
    enum FocusedField {
        case email
        case password
    }

    @StateObject private var viewModel: LoginViewModel

    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: FocusedField?

    init(viewModel: LoginViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        AppBackground(style: .login) {
            GeometryReader { geometry in
                VStack {
                    Spacer(minLength: 0)

                    VStack(alignment: .leading, spacing: 0) {
                        header
                            .padding(.bottom, 64)

                        VStack(spacing: 20) {
                            VStack(spacing: 12) {
                                loginField(
                                    icon: .mail,
                                    placeholder: "メールアドレス",
                                    tint: AppColor.blue500,
                                    border: AppColor.blue300,
                                    glowColors: [AppColor.blue400.opacity(0.40), AppColor.cyan400.opacity(0.40)],
                                    field: .email
                                ) {
                                    TextField("", text: $email, prompt: placeholderText("メールアドレス"))
                                        .textInputAutocapitalization(.never)
                                        .keyboardType(.emailAddress)
                                        .autocorrectionDisabled()
                                        .focused($focusedField, equals: .email)
                                }

                                loginField(
                                    icon: .lock,
                                    placeholder: "パスワード",
                                    tint: AppColor.green500,
                                    border: AppColor.green300,
                                    glowColors: [AppColor.green400.opacity(0.40), AppColor.emerald400.opacity(0.40)],
                                    field: .password
                                ) {
                                    SecureField("", text: $password, prompt: placeholderText("パスワード"))
                                        .focused($focusedField, equals: .password)
                                }
                            }

                            signInButton

                            authStatus
                        }
                    }
                    .frame(maxWidth: 500)
                    .frame(width: formWidth(for: geometry), alignment: .leading)

                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 48)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("ようこそ！")
                .font(AppFont.fredoka(72, weight: .bold))
                .foregroundStyle(AppColor.purple700)

            Text("ログインしてはじめよう")
                .font(AppFont.nunito(20, weight: .semibold))
                .foregroundStyle(AppColor.purple600)
        }
    }

    private var signInButton: some View {
        Button {
            focusedField = nil
            viewModel.signIn(username: email, password: password)
        } label: {
            HStack {
                Text(viewModel.state.isSigningIn ? "ログイン中..." : "ログイン！")
                    .font(AppFont.fredoka(20, weight: .bold))

                Spacer()

                LucideIcon(kind: .arrowRight, size: 24, color: .white)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 24)
            .padding(.vertical, 24)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: AppRadius.card, style: .continuous)
                    .fill(AppGradient.loginButton)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.card, style: .continuous)
                    .stroke(Color.white.opacity(0.5), lineWidth: 4)
            )
            .appShadow(.xl)
        }
        .disabled(viewModel.state.isSigningIn)
        .opacity(viewModel.state.isSigningIn ? 0.72 : 1)
        .buttonStyle(PressScaleButtonStyle(pressedScale: 0.98))
        .hoverEffect(.lift)
    }

    @ViewBuilder
    private var authStatus: some View {
        if let errorMessage = viewModel.state.errorMessage, !errorMessage.isEmpty {
            Text(errorMessage)
                .font(AppFont.nunito(14, weight: .bold))
                .foregroundStyle(AppColor.pink600)
                .fixedSize(horizontal: false, vertical: true)
        } else if viewModel.state.isSigningIn, !viewModel.state.statusMessage.isEmpty {
            Text(viewModel.state.statusMessage)
                .font(AppFont.nunito(14, weight: .bold))
                .foregroundStyle(AppColor.purple600)
        }
    }

    private func loginField<Field: View>(
        icon: LucideIcon.Kind,
        placeholder: String,
        tint: Color,
        border: Color,
        glowColors: [Color],
        field: FocusedField,
        @ViewBuilder input: () -> Field
    ) -> some View {
        GlassCard(
            cornerRadius: AppRadius.card,
            borderColor: border,
            borderWidth: 4,
            opacity: 0.80,
            shadow: .lg
        ) {
            HStack(spacing: 16) {
                LucideIcon(kind: icon, size: 24, color: tint)

                input()
                    .font(AppFont.nunito(18, weight: .semibold))
                    .foregroundStyle(AppColor.gray800)
                    .tint(tint)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 20)
        }
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: AppRadius.card, style: .continuous)
                .fill(
                    LinearGradient(colors: glowColors, startPoint: .leading, endPoint: .trailing)
                )
                .blur(radius: 24)
                .opacity(focusedField == field ? 1 : 0)
                .animation(.easeInOut(duration: 0.3), value: focusedField)
        )
        .accessibilityLabel(placeholder)
    }

    private func placeholderText(_ text: String) -> Text {
        Text(text).foregroundStyle(AppColor.gray400)
    }

    private func formWidth(for geometry: GeometryProxy) -> CGFloat {
        guard geometry.size.width.isFinite else {
            return 500
        }

        return min(max(geometry.size.width - 96, 1), 500)
    }
}

#Preview {
    LoginScreen(
        viewModel: LoginViewModel(
            signInUseCase: SignInUseCase(
                repository: PreviewAuthSessionRepository()
            )
        )
    )
}
