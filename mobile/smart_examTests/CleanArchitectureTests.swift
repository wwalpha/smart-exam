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
        repository.refreshAccessTokenResult = "refreshed"

        let session = try await SignInUseCase(repository: repository)
            .execute(username: "user@example.com", password: "password")
        XCTAssertEqual(session, expectedSession)
        XCTAssertEqual(repository.receivedUsername, "user@example.com")
        XCTAssertEqual(repository.receivedPassword, "password")

        let token = try await GetAccessTokenUseCase(repository: repository).execute()
        XCTAssertEqual(token, "access")

        let refreshedToken = try await RefreshAccessTokenUseCase(repository: repository).execute()
        XCTAssertEqual(refreshedToken, "refreshed")
        XCTAssertTrue(repository.didRefreshAccessToken)

        SignOutUseCase(repository: repository).execute()
        XCTAssertTrue(repository.didSignOut)
    }

    func testAuthorizedAPIRequestAddsBearerToken() async throws {
        var capturedHeaders: [String: String] = [:]
        URLProtocolStub.reset { request in
            capturedHeaders = request.allHTTPHeaderFields ?? [:]
            return Self.jsonResponse(statusCode: 200, body: #"{"ok":true}"#)
        }

        let client = APIClient(
            baseURL: URL(string: "https://example.com")!,
            urlSessionConfiguration: Self.stubURLSessionConfiguration(),
            accessTokenProvider: { "access" },
            refreshAccessTokenProvider: { "refreshed" }
        )

        let response: OKResponse = try await client.getDecodable(
            path: "/private",
            requiresAuthorization: true
        )

        XCTAssertTrue(response.ok)
        XCTAssertEqual(capturedHeaders["Authorization"], "Bearer access")
        XCTAssertNil(capturedHeaders[CognitoRequestInterceptor.requiresAuthorizationHeader])
        XCTAssertEqual(URLProtocolStub.requestCount, 1)
    }

    func testExpiredAccessTokenRefreshesBeforeRequest() async throws {
        URLProtocolStub.reset { _ in
            Self.jsonResponse(
                statusCode: 200,
                body: #"{"AuthenticationResult":{"AccessToken":"refreshed","IdToken":"id","ExpiresIn":3600,"TokenType":"Bearer"}}"#
            )
        }

        let expiredSession = AuthSession(
            accessToken: "expired",
            idToken: "id",
            refreshToken: "refresh",
            expiresAt: Date().addingTimeInterval(-60),
            tokenType: "Bearer"
        )
        let repository = AuthSessionRepositoryImpl(
            authClient: AppAuthClient(
                configProvider: TestOIDCConfigProvider(),
                urlSession: URLSession(configuration: Self.stubURLSessionConfiguration())
            ),
            store: InMemoryAuthStateStore(session: expiredSession)
        )

        let token = try await repository.accessToken()

        XCTAssertEqual(token, "refreshed")
        XCTAssertEqual(repository.currentSession?.accessToken, "refreshed")
        XCTAssertEqual(repository.currentSession?.refreshToken, "refresh")
        XCTAssertEqual(URLProtocolStub.requestCount, 1)
    }

    func testExpiredRefreshTokenClearsSession() async throws {
        URLProtocolStub.reset { _ in
            Self.jsonResponse(
                statusCode: 400,
                body: #"{"__type":"NotAuthorizedException","message":"Refresh Token has expired"}"#
            )
        }

        let expiredSession = AuthSession(
            accessToken: "expired",
            idToken: "id",
            refreshToken: "expired-refresh",
            expiresAt: Date().addingTimeInterval(-60),
            tokenType: "Bearer"
        )
        let store = InMemoryAuthStateStore(session: expiredSession)
        let repository = AuthSessionRepositoryImpl(
            authClient: AppAuthClient(
                configProvider: TestOIDCConfigProvider(),
                urlSession: URLSession(configuration: Self.stubURLSessionConfiguration())
            ),
            store: store
        )

        do {
            _ = try await repository.accessToken()
            XCTFail("Expected refresh token expiry")
        } catch {
            XCTAssertNil(repository.currentSession)
            XCTAssertNil(try store.loadSession())
            XCTAssertEqual(URLProtocolStub.requestCount, 1)
        }
    }

    func testRefreshServerFailureKeepsSession() async throws {
        URLProtocolStub.reset { _ in
            Self.jsonResponse(
                statusCode: 500,
                body: #"{"__type":"InternalErrorException","message":"temporary failure"}"#
            )
        }

        let expiredSession = AuthSession(
            accessToken: "expired",
            idToken: "id",
            refreshToken: "refresh",
            expiresAt: Date().addingTimeInterval(-60),
            tokenType: "Bearer"
        )
        let store = InMemoryAuthStateStore(session: expiredSession)
        let repository = AuthSessionRepositoryImpl(
            authClient: AppAuthClient(
                configProvider: TestOIDCConfigProvider(),
                urlSession: URLSession(configuration: Self.stubURLSessionConfiguration())
            ),
            store: store
        )

        do {
            _ = try await repository.accessToken()
            XCTFail("Expected refresh failure")
        } catch {
            XCTAssertEqual(repository.currentSession, expiredSession)
            XCTAssertEqual(try store.loadSession(), expiredSession)
            XCTAssertEqual(URLProtocolStub.requestCount, 1)
        }
    }

    func testAuthorizedAPIRequestRefreshesAndRetriesOnceAfter401() async throws {
        URLProtocolStub.reset { _ in
            if URLProtocolStub.requestCount == 1 {
                return Self.jsonResponse(statusCode: 401, body: #"{"error":"unauthorized"}"#)
            }

            return Self.jsonResponse(statusCode: 200, body: #"{"ok":true}"#)
        }

        var refreshCount = 0
        let client = APIClient(
            baseURL: URL(string: "https://example.com")!,
            urlSessionConfiguration: Self.stubURLSessionConfiguration(),
            accessTokenProvider: { "access" },
            refreshAccessTokenProvider: {
                refreshCount += 1
                return "refreshed"
            }
        )

        let response: OKResponse = try await client.getDecodable(
            path: "/private",
            requiresAuthorization: true
        )

        XCTAssertTrue(response.ok)
        XCTAssertEqual(refreshCount, 1)
        XCTAssertEqual(URLProtocolStub.requestCount, 2)
    }

    func testConcurrent401ResponsesShareOneRefresh() async throws {
        URLProtocolStub.reset { request in
            if request.value(forHTTPHeaderField: "Authorization") == "Bearer access" {
                return Self.jsonResponse(statusCode: 401, body: #"{"error":"unauthorized"}"#)
            }

            return Self.jsonResponse(statusCode: 200, body: #"{"ok":true}"#)
        }

        var currentToken = "access"
        var refreshCount = 0
        let client = APIClient(
            baseURL: URL(string: "https://example.com")!,
            urlSessionConfiguration: Self.stubURLSessionConfiguration(),
            accessTokenProvider: {
                currentToken
            },
            refreshAccessTokenProvider: {
                refreshCount += 1
                try await Task.sleep(nanoseconds: 100_000_000)
                currentToken = "refreshed"
                return currentToken
            }
        )

        async let first: OKResponse = client.getDecodable(
            path: "/private/1",
            requiresAuthorization: true
        )
        async let second: OKResponse = client.getDecodable(
            path: "/private/2",
            requiresAuthorization: true
        )

        let responses = try await [first, second]
        XCTAssertEqual(responses.map(\.ok), [true, true])
        XCTAssertEqual(refreshCount, 1)
        XCTAssertEqual(URLProtocolStub.requestCount, 4)
    }

    func testAuthorizedAPIRequestDoesNotRetryWhenRefreshFails() async {
        URLProtocolStub.reset { _ in
            Self.jsonResponse(statusCode: 401, body: #"{"error":"unauthorized"}"#)
        }

        var refreshCount = 0
        let client = APIClient(
            baseURL: URL(string: "https://example.com")!,
            urlSessionConfiguration: Self.stubURLSessionConfiguration(),
            accessTokenProvider: { "access" },
            refreshAccessTokenProvider: {
                refreshCount += 1
                throw TestError.refreshFailed
            }
        )

        do {
            let _: OKResponse = try await client.getDecodable(
                path: "/private",
                requiresAuthorization: true
            )
            XCTFail("Expected refresh failure")
        } catch {
            XCTAssertEqual(refreshCount, 1)
            XCTAssertEqual(URLProtocolStub.requestCount, 1)
        }
    }

    func testAuthorizedAPIRequestClearsSessionWhenRetryStillReturns401() async throws {
        URLProtocolStub.reset { _ in
            Self.jsonResponse(statusCode: 401, body: #"{"error":"unauthorized"}"#)
        }

        var didHandleAuthorizationFailure = false
        let client = APIClient(
            baseURL: URL(string: "https://example.com")!,
            urlSessionConfiguration: Self.stubURLSessionConfiguration(),
            accessTokenProvider: { "access" },
            refreshAccessTokenProvider: { "refreshed" },
            authorizationFailureHandler: {
                didHandleAuthorizationFailure = true
            }
        )

        do {
            let _: OKResponse = try await client.getDecodable(
                path: "/private",
                requiresAuthorization: true
            )
            XCTFail("Expected final unauthorized response")
        } catch {
            try await waitForAsyncViewModelWork()
            XCTAssertTrue(didHandleAuthorizationFailure)
            XCTAssertEqual(URLProtocolStub.requestCount, 2)
        }
    }

    func testConcurrentForcedRefreshUsesSingleFlight() async throws {
        URLProtocolStub.reset { _ in
            Thread.sleep(forTimeInterval: 0.1)
            return Self.jsonResponse(
                statusCode: 200,
                body: #"{"AuthenticationResult":{"AccessToken":"refreshed","IdToken":"id","ExpiresIn":3600,"TokenType":"Bearer"}}"#
            )
        }

        let session = AuthSession(
            accessToken: "access",
            idToken: "id",
            refreshToken: "refresh",
            expiresAt: Date().addingTimeInterval(3600),
            tokenType: "Bearer"
        )
        let repository = AuthSessionRepositoryImpl(
            authClient: AppAuthClient(
                configProvider: TestOIDCConfigProvider(),
                urlSession: URLSession(configuration: Self.stubURLSessionConfiguration())
            ),
            store: InMemoryAuthStateStore(session: session)
        )

        async let first = repository.refreshAccessToken()
        async let second = repository.refreshAccessToken()

        let tokens = try await [first, second]
        XCTAssertEqual(tokens, ["refreshed", "refreshed"])
        XCTAssertEqual(URLProtocolStub.requestCount, 1)
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

    func testPDFRemoteDataSourceResolvesMaterialQuestionPDF() async throws {
        var requestedPaths: [String] = []
        var authorizationHeaders: [String?] = []

        URLProtocolStub.reset { request in
            requestedPaths.append(request.url?.path ?? "")
            authorizationHeaders.append(request.value(forHTTPHeaderField: "Authorization"))

            switch request.url?.path {
            case "/api/materials/material-1/files":
                return Self.jsonResponse(
                    statusCode: 200,
                    body: """
                    {
                      "datas": [
                        {
                          "id": "answer-file",
                          "materialId": "material-1",
                          "filename": "answer.pdf",
                          "s3Key": "materials/material-1/ANSWER/answer-file",
                          "contentType": "application/pdf",
                          "fileType": "ANSWER",
                          "createdAt": "2026-04-18T13:00:00.000+09:00"
                        },
                        {
                          "id": "question-file",
                          "materialId": "material-1",
                          "filename": "question.pdf",
                          "s3Key": "materials/material-1/QUESTION/question-file",
                          "contentType": "application/pdf",
                          "fileType": "QUESTION",
                          "createdAt": "2026-04-18T14:00:00.000+09:00"
                        }
                      ]
                    }
                    """
                )
            case "/api/materials/material-1/files/question-file":
                return Self.jsonResponse(
                    statusCode: 200,
                    body: #"{"downloadUrl":"https://files.example.com/question.pdf?X-Amz-Expires=300"}"#
                )
            default:
                return Self.jsonResponse(statusCode: 404, body: #"{"message":"not found"}"#)
            }
        }

        let client = APIClient(
            baseURL: URL(string: "https://example.com")!,
            urlSessionConfiguration: Self.stubURLSessionConfiguration(),
            accessTokenProvider: { "access" },
            refreshAccessTokenProvider: { "refreshed" }
        )
        let dataSource = PDFRemoteDataSource(apiClient: client)
        let descriptor = PDFDocumentDescriptor(
            id: "material-1-question-pdf",
            title: "問題PDF",
            sourceType: .materialFile,
            materialId: "material-1",
            materialFileType: .question
        )

        let resolved = try await dataSource.resolve(descriptor: descriptor)

        XCTAssertEqual(requestedPaths, [
            "/api/materials/material-1/files",
            "/api/materials/material-1/files/question-file"
        ])
        XCTAssertEqual(authorizationHeaders, ["Bearer access", "Bearer access"])
        XCTAssertEqual(resolved.url, URL(string: "https://files.example.com/question.pdf?X-Amz-Expires=300"))
        XCTAssertEqual(resolved.materialId, "material-1")
        XCTAssertEqual(resolved.materialFileType, .question)
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
        let pdfRepository = PDFRepositorySpy()
        repository.detailResult = Self.detail(id: "exam-1")
        let viewModel = ExamDetailViewModel(
            examId: "exam-1",
            fetchExamDetailUseCase: FetchExamDetailUseCase(repository: repository),
            checkMaterialPDFAvailabilityUseCase: CheckMaterialPDFAvailabilityUseCase(repository: pdfRepository)
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

    private static func stubURLSessionConfiguration() -> URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [URLProtocolStub.self]
        return configuration
    }

    private static func jsonResponse(statusCode: Int, body: String) -> (HTTPURLResponse, Data) {
        (
            HTTPURLResponse(
                url: URL(string: "https://example.com")!,
                statusCode: statusCode,
                httpVersion: nil,
                headerFields: ["Content-Type": "application/json"]
            )!,
            Data(body.utf8)
        )
    }
}

@MainActor
private final class AuthRepositorySpy: AuthSessionRepository {
    var currentSession: AuthSession?
    var signInResult: AuthSession?
    var accessTokenResult = "access"
    var refreshAccessTokenResult = "refreshed"
    var receivedUsername: String?
    var receivedPassword: String?
    var didSignOut = false
    var didRefreshAccessToken = false

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

    func refreshAccessToken() async throws -> String {
        didRefreshAccessToken = true
        return refreshAccessTokenResult
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
    var materialFileExistsResult = false
    var receivedMaterialId: String?
    var receivedMaterialFileType: PDFMaterialFileType?

    func resolve(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor {
        receivedDescriptor = descriptor
        return result ?? descriptor
    }

    func materialFileExists(materialId: String, fileType: PDFMaterialFileType) async throws -> Bool {
        receivedMaterialId = materialId
        receivedMaterialFileType = fileType
        return materialFileExistsResult
    }
}

private struct OKResponse: Decodable {
    let ok: Bool
}

private enum TestError: Error {
    case refreshFailed
}

private struct TestOIDCConfigProvider: OIDCConfigProviding {
    var configuration: OIDCConfiguration {
        OIDCConfiguration(
            issuer: "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_test",
            clientID: "client",
            redirectURI: "smart-exam://auth",
            logoutURL: "https://example.com/logout",
            scopes: ["openid"],
            backendBaseURL: "https://example.com",
            identityProviderEndpoint: URL(string: "https://cognito-idp.ap-northeast-1.amazonaws.com")!
        )
    }
}

private final class InMemoryAuthStateStore: AuthStateStore {
    private var session: AuthSession?

    init(session: AuthSession?) {
        self.session = session
    }

    func loadSession() throws -> AuthSession? {
        session
    }

    func saveSession(_ session: AuthSession?) throws {
        self.session = session
    }
}

private final class URLProtocolStub: URLProtocol {
    nonisolated(unsafe) static var requestCount = 0
    nonisolated(unsafe) private static var handler: ((URLRequest) throws -> (HTTPURLResponse, Data))?
    private static let lock = NSLock()

    static func reset(handler: @escaping (URLRequest) throws -> (HTTPURLResponse, Data)) {
        lock.lock()
        requestCount = 0
        self.handler = handler
        lock.unlock()
    }

    override class func canInit(with request: URLRequest) -> Bool {
        true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        Self.lock.lock()
        Self.requestCount += 1
        let handler = Self.handler
        Self.lock.unlock()

        guard let handler else {
            client?.urlProtocol(self, didFailWithError: TestError.refreshFailed)
            return
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
