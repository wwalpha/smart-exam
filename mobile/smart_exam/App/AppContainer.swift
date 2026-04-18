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
    private let checkMaterialPDFAvailabilityUseCase: CheckMaterialPDFAvailabilityUseCase

    init() {
        let configProvider = BundleOIDCConfigProvider()
        let authClient = AppAuthClient(configProvider: configProvider)
        let authStore = UserDefaultsAuthStateStore()
        let authRepository = AuthSessionRepositoryImpl(authClient: authClient, store: authStore)
        let getAccessTokenUseCase = GetAccessTokenUseCase(repository: authRepository)
        let refreshAccessTokenUseCase = RefreshAccessTokenUseCase(repository: authRepository)

        let apiClient = APIClient(
            accessTokenProvider: {
                try await getAccessTokenUseCase.execute()
            },
            refreshAccessTokenProvider: {
                try await refreshAccessTokenUseCase.execute()
            }
        )
        let examRemoteDataSource = ExamRemoteDataSource(apiClient: apiClient)
        let examRepository = ExamRepositoryImpl(remoteDataSource: examRemoteDataSource)

        let pdfRepository = PDFRepositoryImpl(remoteDataSource: PDFRemoteDataSource(apiClient: apiClient))

        self.authRepository = authRepository
        self.signInUseCase = SignInUseCase(repository: authRepository)
        self.fetchExamListUseCase = FetchExamListUseCase(repository: examRepository)
        self.fetchExamDetailUseCase = FetchExamDetailUseCase(repository: examRepository)
        self.resolvePDFSourceUseCase = ResolvePDFSourceUseCase(repository: pdfRepository)
        self.checkMaterialPDFAvailabilityUseCase = CheckMaterialPDFAvailabilityUseCase(repository: pdfRepository)
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
        ExamDetailViewModel(
            examId: examId,
            fetchExamDetailUseCase: fetchExamDetailUseCase,
            checkMaterialPDFAvailabilityUseCase: checkMaterialPDFAvailabilityUseCase
        )
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
