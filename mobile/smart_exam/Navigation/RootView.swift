import SwiftUI

struct RootView: View {
    @ObservedObject var viewModel: RootViewModel
    let container: AppContainer
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            LoginScreen(viewModel: container.makeLoginViewModel())
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .examList:
                        ExamListView(viewModel: container.makeExamListViewModel()) { exam in
                            path.append(AppRoute.examDetail(id: exam.examId))
                        }
                    case .examDetail(let id):
                        ExamDetailView(
                            viewModel: container.makeExamDetailViewModel(examId: id),
                            onBack: { popToExamList() },
                            onOpenPDF: { descriptor in
                                path.append(AppRoute.pdfViewer(descriptor))
                            }
                        )
                    case .pdfViewer(let descriptor):
                        PDFViewerView(
                            viewModel: container.makePDFViewerViewModel(descriptor: descriptor),
                            onBack: { popLast() }
                        )
                    }
                }
        }
        .onAppear {
            viewModel.start()
            routeForAuthenticationState(viewModel.isAuthenticated)
        }
        .onChange(of: viewModel.isAuthenticated) { _, isAuthenticated in
            routeForAuthenticationState(isAuthenticated)
        }
        .toolbar(.hidden, for: .navigationBar)
        .preferredColorScheme(.light)
    }

    private func routeForAuthenticationState(_ isAuthenticated: Bool) {
        if isAuthenticated {
            guard path.isEmpty else { return }
            path.append(AppRoute.examList)
        } else {
            path = NavigationPath()
        }
    }

    private func popLast() {
        guard !path.isEmpty else { return }
        path.removeLast()
    }

    private func popToExamList() {
        guard path.count > 1 else {
            popLast()
            return
        }

        path.removeLast(path.count - 1)
    }
}
