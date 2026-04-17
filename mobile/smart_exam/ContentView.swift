import SwiftUI

struct ContentView: View {
    var body: some View {
        RootView()
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
