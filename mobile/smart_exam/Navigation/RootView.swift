import SwiftUI

struct RootView: View {
    @EnvironmentObject private var authService: AuthService
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            LoginScreen(
                isSigningIn: authService.isSigningIn,
                statusMessage: authService.statusMessage,
                errorMessage: authService.errorMessage
            ) {
                authService.discoverAndSignIn()
            }
            .navigationDestination(for: AppRoute.self) { route in
                switch route {
                case .projectList:
                    ProjectListScreen { exam in
                        path.append(AppRoute.projectDetail(id: exam.examId))
                    }
                case .projectDetail(let id):
                    ProjectDetailScreen(
                        projectId: id,
                        onBack: { popToProjectList() },
                        onOpenPDF: { materialId in
                            path.append(AppRoute.pdfViewer(projectId: id, materialId: materialId))
                        }
                    )
                case .pdfViewer(let projectId, let materialId):
                    PDFViewerScreen(
                        projectId: projectId,
                        materialId: materialId,
                        onBack: { popLast() }
                    )
                }
            }
        }
        .onAppear {
            routeForAuthenticationState(authService.isAuthenticated)
        }
        .onChange(of: authService.isAuthenticated) { _, isAuthenticated in
            routeForAuthenticationState(isAuthenticated)
        }
        .toolbar(.hidden, for: .navigationBar)
        .preferredColorScheme(.light)
    }

    private func routeForAuthenticationState(_ isAuthenticated: Bool) {
        if isAuthenticated {
            guard path.isEmpty else { return }
            path.append(AppRoute.projectList)
        } else {
            path = NavigationPath()
        }
    }

    private func popLast() {
        guard !path.isEmpty else { return }
        path.removeLast()
    }

    private func popToProjectList() {
        guard path.count > 1 else {
            popLast()
            return
        }

        path.removeLast(path.count - 1)
    }
}
