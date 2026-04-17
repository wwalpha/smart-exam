import SwiftUI

struct RootView: View {
    @State private var path = NavigationPath()
    @StateObject private var authSession = MockAuthSessionProvider()

    var body: some View {
        NavigationStack(path: $path) {
            LoginScreen {
                authSession.signIn()
                path.append(AppRoute.projectList)
            }
            .navigationDestination(for: AppRoute.self) { route in
                switch route {
                case .projectList:
                    ProjectListScreen { project in
                        path.append(AppRoute.projectDetail(id: project.id))
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
        .toolbar(.hidden, for: .navigationBar)
        .preferredColorScheme(.light)
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
