import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var authService: AuthService

    var body: some View {
        Group {
            if authService.isAuthenticated {
                LoggedInDummyView()
            } else {
                LoginView()
            }
        }
    }
}

private struct LoginView: View {
    @EnvironmentObject private var authService: AuthService

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ZStack {
                    LinearGradient(
                        colors: [Color(uiColor: .systemIndigo), Color(uiColor: .systemTeal)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .ignoresSafeArea()

                    VStack(spacing: 24) {
                        VStack(spacing: 12) {
                            Image(systemName: "lock.shield.fill")
                                .font(.system(size: 54))
                                .foregroundStyle(.white)

                            Text("Smart Exam")
                                .font(.system(size: 38, weight: .bold))
                                .foregroundStyle(.white)

                            Text("Cognito Managed Login でサインイン")
                                .font(.title3)
                                .foregroundStyle(.white.opacity(0.9))
                        }

                        VStack(alignment: .leading, spacing: 16) {
                            statusRow(title: "Issuer", value: OIDCConfig.issuer)
                            statusRow(title: "Client ID", value: OIDCConfig.clientID)
                            statusRow(title: "Redirect URI", value: OIDCConfig.redirectURI)
                            statusRow(title: "状態", value: authService.statusMessage)

                            if let errorMessage = authService.errorMessage {
                                Text(errorMessage)
                                    .foregroundStyle(.red)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            Button("Cognito でログイン") {
                                authService.discoverAndSignIn()
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.large)
                            .frame(maxWidth: .infinity, alignment: .center)
                        }
                        .padding(28)
                        .frame(maxWidth: min(geometry.size.width * 0.72, 720))
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28))
                    }
                    .padding(32)
                }
            }
            .navigationBarHidden(true)
        }
    }

    private func statusRow(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text(value)
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

private struct LoggedInDummyView: View {
    @EnvironmentObject private var authService: AuthService

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("ログイン成功")
                                .font(.largeTitle.weight(.bold))
                            Text("ここはログイン後のダミー画面です。本番ではこの領域を受験画面や管理画面に置き換えます。")
                                .font(.title3)
                                .foregroundStyle(.secondary)
                        }

                        HStack(spacing: 12) {
                            Button("UserInfo 取得") {
                                authService.fetchUserInfo()
                            }
                            .buttonStyle(.borderedProminent)

                            Button("Backend API 呼び出し") {
                                Task {
                                    await authService.callBackendExample()
                                }
                            }
                            .buttonStyle(.bordered)

                            Button("ログアウト") {
                                authService.logout()
                            }
                            .buttonStyle(.bordered)
                        }

                        infoCard(title: "認証状態", body: authService.statusMessage)

                        if let errorMessage = authService.errorMessage {
                            infoCard(title: "Error", body: errorMessage, tint: .red)
                        }

                        payloadCard(title: "UserInfo", payload: authService.userInfo)
                        payloadCard(title: "Backend Response", payload: authService.backendResponse)
                    }
                    .frame(maxWidth: min(geometry.size.width * 0.82, 920), alignment: .leading)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 40)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color(uiColor: .secondarySystemBackground))
            }
            .navigationTitle("Home")
        }
    }

    private func infoCard(title: String, body: String, tint: Color = .accentColor) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
            Text(body)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(tint.opacity(0.08), in: RoundedRectangle(cornerRadius: 18))
    }

    private func payloadCard(title: String, payload: [String: Any]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.title2.weight(.semibold))

            Text(prettyPrintedJSON(from: payload))
                .font(.system(.body, design: .monospaced))
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(.background, in: RoundedRectangle(cornerRadius: 18))
        }
    }

    private func prettyPrintedJSON(from dictionary: [String: Any]) -> String {
        guard !dictionary.isEmpty else {
            return "データなし"
        }

        guard JSONSerialization.isValidJSONObject(dictionary),
              let data = try? JSONSerialization.data(withJSONObject: dictionary, options: [.prettyPrinted]),
              let string = String(data: data, encoding: .utf8)
        else {
            return dictionary.description
        }

        return string
    }
}

@MainActor
private struct ContentViewPreviewHost: View {
    @StateObject private var authService = AuthService()

    var body: some View {
        ContentView()
            .environmentObject(authService)
    }
}

#Preview("Login") {
    ContentViewPreviewHost()
}
