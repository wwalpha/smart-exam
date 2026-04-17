import XCTest
@testable import smart_exam

@MainActor
final class CleanArchitectureTests: XCTestCase {
    func testAuthUseCasesDelegateToRepository() async throws {
        let repository = AuthRepositorySpy()
        let expectedSession = AuthSession(
            accessToken: "access",
            idToken: "id",
            refreshToken: "refresh",
            expiresAt: Date().addingTimeInterval(3600),
            tokenType: "Bearer"
        )
        repository.signInResult = expectedSession
        repository.accessTokenResult = "access"

        let session = try await SignInUseCase(repository: repository)
            .execute(username: "user@example.com", password: "password")
        XCTAssertEqual(session, expectedSession)
        XCTAssertEqual(repository.receivedUsername, "user@example.com")
        XCTAssertEqual(repository.receivedPassword, "password")

        let token = try await GetAccessTokenUseCase(repository: repository).execute()
        XCTAssertEqual(token, "access")

        SignOutUseCase(repository: repository).execute()
        XCTAssertTrue(repository.didSignOut)
    }

    func testExamUseCasesDelegateToRepository() async throws {
        let repository = ExamRepositorySpy()
        repository.listResult = ExamListResult(items: [Self.exam(id: "exam-1")], total: 1, cursor: "next")
        repository.detailResult = Self.detail(id: "exam-1")

        let list = try await FetchExamListUseCase(repository: repository).execute()
        XCTAssertEqual(list.items.map(\.examId), ["exam-1"])
        XCTAssertEqual(list.total, 1)
        XCTAssertEqual(repository.receivedListMode, .material)
        XCTAssertEqual(repository.receivedListStatus, "ALL")

        let detail = try await FetchExamDetailUseCase(repository: repository).execute(examId: "exam-1")
        XCTAssertEqual(detail.examId, "exam-1")
        XCTAssertEqual(repository.receivedDetailId, "exam-1")
    }

    func testResolvePDFSourceUseCaseDelegatesToRepository() async throws {
        let descriptor = PDFDocumentDescriptor(
            id: "pdf-1",
            title: "Material",
            url: URL(string: "https://example.com/material.pdf")!,
            sourceType: .remote
        )
        let repository = PDFRepositorySpy()
        repository.result = descriptor

        let resolved = try await ResolvePDFSourceUseCase(repository: repository).execute(descriptor: descriptor)
        XCTAssertEqual(resolved, descriptor)
        XCTAssertEqual(repository.receivedDescriptor, descriptor)
    }

    func testLoginViewModelReportsSuccessfulSignIn() async throws {
        let repository = AuthRepositorySpy()
        repository.signInResult = AuthSession(
            accessToken: "access",
            idToken: "id",
            refreshToken: "refresh",
            expiresAt: Date().addingTimeInterval(3600),
            tokenType: "Bearer"
        )
        let viewModel = LoginViewModel(signInUseCase: SignInUseCase(repository: repository))

        viewModel.signIn(username: "user@example.com", password: "password")
        try await waitForAsyncViewModelWork()

        XCTAssertFalse(viewModel.state.isSigningIn)
        XCTAssertEqual(viewModel.state.statusMessage, "認証済み")
        XCTAssertNil(viewModel.state.errorMessage)
    }

    func testRootViewModelObservesAuthStateAndSignsOut() async throws {
        let repository = AuthRepositorySpy()
        let viewModel = RootViewModel(
            observeAuthSessionUseCase: ObserveAuthSessionUseCase(repository: repository),
            signOutUseCase: SignOutUseCase(repository: repository)
        )

        viewModel.start()
        repository.emit(
            AuthSession(
                accessToken: "access",
                idToken: "id",
                refreshToken: "refresh",
                expiresAt: Date().addingTimeInterval(3600),
                tokenType: "Bearer"
            )
        )
        try await waitForAsyncViewModelWork()
        XCTAssertTrue(viewModel.isAuthenticated)

        viewModel.signOut()
        XCTAssertTrue(repository.didSignOut)
    }

    func testExamListViewModelLoadsListState() async throws {
        let repository = ExamRepositorySpy()
        repository.listResult = ExamListResult(items: [Self.exam(id: "exam-1")], total: 1, cursor: nil)
        let viewModel = ExamListViewModel(fetchExamListUseCase: FetchExamListUseCase(repository: repository))

        viewModel.load()
        try await waitForAsyncViewModelWork()

        XCTAssertFalse(viewModel.state.isLoading)
        XCTAssertEqual(viewModel.state.exams.map(\.examId), ["exam-1"])
        XCTAssertEqual(viewModel.state.total, 1)
        XCTAssertNil(viewModel.state.errorMessage)
    }

    func testExamDetailViewModelLoadsDetailState() async throws {
        let repository = ExamRepositorySpy()
        repository.detailResult = Self.detail(id: "exam-1")
        let viewModel = ExamDetailViewModel(
            examId: "exam-1",
            fetchExamDetailUseCase: FetchExamDetailUseCase(repository: repository)
        )

        viewModel.load()
        try await waitForAsyncViewModelWork()

        XCTAssertFalse(viewModel.state.isLoading)
        XCTAssertEqual(viewModel.state.detail?.examId, "exam-1")
        XCTAssertNil(viewModel.state.errorMessage)
    }

    func testExamMapperMapsListAndDetailDTOs() {
        let examDTO = ExamDTO(
            examId: "exam-1",
            subject: .japanese,
            mode: .material,
            createdDate: "2026-04-18",
            submittedDate: nil,
            status: .completed,
            pdf: ExamPDFInfoDTO(url: "https://example.com/a.pdf", downloadUrl: "https://example.com/a.pdf"),
            count: 2,
            results: [
                ExamResultDTO(id: "q1", isCorrect: true),
                ExamResultDTO(id: "q2", isCorrect: false)
            ]
        )

        let exam = ExamMapper.map(examDTO)
        XCTAssertEqual(exam.examId, "exam-1")
        XCTAssertEqual(exam.correctCount, 1)
        XCTAssertEqual(exam.pdf.url, "https://example.com/a.pdf")

        let detailDTO = ExamDetailDTO(
            examId: "exam-1",
            subject: .japanese,
            mode: .material,
            createdDate: "2026-04-18",
            submittedDate: nil,
            status: .completed,
            pdf: ExamPDFInfoDTO(url: "https://example.com/a.pdf", downloadUrl: "https://example.com/a.pdf"),
            count: 1,
            results: [ExamResultDTO(id: "q1", isCorrect: true)],
            items: [
                ExamItemDTO(
                    id: "q1",
                    examId: "exam-1",
                    targetType: .material,
                    targetId: "target-1",
                    displayLabel: "Question 1",
                    canonicalKey: "key",
                    kanji: nil,
                    materialId: "material-1",
                    grade: "5",
                    provider: "provider",
                    materialName: "material",
                    materialDate: "2026-04-18",
                    questionText: "question",
                    answerText: "answer",
                    correctAnswer: "answer",
                    readingHiragana: nil,
                    underlineSpec: ExamItemDTO.UnderlineSpecDTO(type: "range", start: 1, length: 2),
                    isCorrect: true,
                    itemId: "item-1"
                )
            ]
        )

        let detail = ExamMapper.map(detailDTO)
        XCTAssertEqual(detail.items.first?.id, "q1")
        XCTAssertEqual(detail.items.first?.underlineSpec?.start, 1)
        XCTAssertEqual(detail.correctCount, 1)
    }

    private static func exam(id: String) -> Exam {
        Exam(
            examId: id,
            subject: .japanese,
            mode: .material,
            createdDate: "2026-04-18",
            submittedDate: nil,
            status: .completed,
            pdf: Exam.PDFInfo(url: "https://example.com/\(id).pdf", downloadUrl: "https://example.com/\(id).pdf"),
            count: 1,
            results: [Exam.Result(id: "q1", isCorrect: true)]
        )
    }

    private static func detail(id: String) -> ExamDetail {
        ExamDetail(
            examId: id,
            subject: .japanese,
            mode: .material,
            createdDate: "2026-04-18",
            submittedDate: nil,
            status: .completed,
            pdf: Exam.PDFInfo(url: "https://example.com/\(id).pdf", downloadUrl: "https://example.com/\(id).pdf"),
            count: 1,
            results: [Exam.Result(id: "q1", isCorrect: true)],
            items: []
        )
    }

    private func waitForAsyncViewModelWork() async throws {
        try await Task.sleep(nanoseconds: 50_000_000)
    }
}

@MainActor
private final class AuthRepositorySpy: AuthSessionRepository {
    var currentSession: AuthSession?
    var signInResult: AuthSession?
    var accessTokenResult = "access"
    var receivedUsername: String?
    var receivedPassword: String?
    var didSignOut = false

    private let stream: AsyncStream<AuthSession?>
    private var continuation: AsyncStream<AuthSession?>.Continuation?

    init() {
        var continuation: AsyncStream<AuthSession?>.Continuation?
        self.stream = AsyncStream { continuation = $0 }
        self.continuation = continuation
    }

    var sessionStream: AsyncStream<AuthSession?> {
        stream
    }

    func signIn(username: String, password: String) async throws -> AuthSession {
        receivedUsername = username
        receivedPassword = password
        let session = signInResult ?? AuthSession(
            accessToken: accessTokenResult,
            idToken: "id",
            refreshToken: "refresh",
            expiresAt: Date().addingTimeInterval(3600),
            tokenType: "Bearer"
        )
        currentSession = session
        emit(session)
        return session
    }

    func signOut() {
        didSignOut = true
        currentSession = nil
        emit(nil)
    }

    func accessToken() async throws -> String {
        accessTokenResult
    }

    func emit(_ session: AuthSession?) {
        currentSession = session
        continuation?.yield(session)
    }
}

private final class ExamRepositorySpy: ExamRepository {
    var listResult = ExamListResult(items: [], total: 0, cursor: nil)
    var detailResult = ExamDetail(
        examId: "exam",
        subject: .japanese,
        mode: .material,
        createdDate: "2026-04-18",
        submittedDate: nil,
        status: .completed,
        pdf: Exam.PDFInfo(url: "https://example.com/exam.pdf", downloadUrl: "https://example.com/exam.pdf"),
        count: 0,
        results: [],
        items: []
    )
    var receivedListMode: ExamMode?
    var receivedListStatus: String?
    var receivedListLimit: Int?
    var receivedDetailId: String?

    func fetchExamList(mode: ExamMode, status: String?, limit: Int?) async throws -> ExamListResult {
        receivedListMode = mode
        receivedListStatus = status
        receivedListLimit = limit
        return listResult
    }

    func fetchExamDetail(examId: String) async throws -> ExamDetail {
        receivedDetailId = examId
        return detailResult
    }
}

private final class PDFRepositorySpy: PDFRepository {
    var result: PDFDocumentDescriptor?
    var receivedDescriptor: PDFDocumentDescriptor?

    func resolve(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor {
        receivedDescriptor = descriptor
        return result ?? descriptor
    }
}
