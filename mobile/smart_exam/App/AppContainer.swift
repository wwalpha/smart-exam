import Combine
import Foundation

@MainActor
final class AppContainer: ObservableObject {
    let rootViewModel: RootViewModel

    private let authRepository: AuthSessionRepositoryImpl
    private let signInUseCase: SignInUseCase
    private let fetchExamListUseCase: FetchExamListUseCase
    private let fetchExamDetailUseCase: FetchExamDetailUseCase
    private let resolvePDFSourceUseCase: ResolvePDFSourceUseCase

    init() {
        let configProvider = BundleOIDCConfigProvider()
        let authClient = AppAuthClient(configProvider: configProvider)
        let authStore = UserDefaultsAuthStateStore()
        let authRepository = AuthSessionRepositoryImpl(authClient: authClient, store: authStore)
        let getAccessTokenUseCase = GetAccessTokenUseCase(repository: authRepository)

        let apiClient = APIClient()
        let examRemoteDataSource = ExamRemoteDataSource(apiClient: apiClient)
        let examRepository = ExamRepositoryImpl(
            remoteDataSource: examRemoteDataSource,
            accessTokenProvider: {
                try await getAccessTokenUseCase.execute()
            }
        )

        let pdfRepository = PDFRepositoryImpl(remoteDataSource: PDFRemoteDataSource())

        self.authRepository = authRepository
        self.signInUseCase = SignInUseCase(repository: authRepository)
        self.fetchExamListUseCase = FetchExamListUseCase(repository: examRepository)
        self.fetchExamDetailUseCase = FetchExamDetailUseCase(repository: examRepository)
        self.resolvePDFSourceUseCase = ResolvePDFSourceUseCase(repository: pdfRepository)
        self.rootViewModel = RootViewModel(
            observeAuthSessionUseCase: ObserveAuthSessionUseCase(repository: authRepository),
            signOutUseCase: SignOutUseCase(repository: authRepository)
        )
    }

    func makeLoginViewModel() -> LoginViewModel {
        LoginViewModel(signInUseCase: signInUseCase)
    }

    func makeExamListViewModel() -> ExamListViewModel {
        ExamListViewModel(fetchExamListUseCase: fetchExamListUseCase)
    }

    func makeExamDetailViewModel(examId: String) -> ExamDetailViewModel {
        ExamDetailViewModel(examId: examId, fetchExamDetailUseCase: fetchExamDetailUseCase)
    }

    func makePDFViewerViewModel(descriptor: PDFDocumentDescriptor) -> PDFViewerViewModel {
        PDFViewerViewModel(
            descriptor: descriptor,
            resolvePDFSourceUseCase: resolvePDFSourceUseCase
        )
    }

    func resumeExternalUserAgentFlow(with url: URL) -> Bool {
        authRepository.resumeExternalUserAgentFlow(with: url)
    }
}
