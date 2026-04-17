import Combine
import Foundation

@MainActor
final class ExamDetailViewModel: ObservableObject {
    @Published private(set) var state = ExamDetailState()

    private let examId: String
    private let fetchExamDetailUseCase: FetchExamDetailUseCase

    init(examId: String, fetchExamDetailUseCase: FetchExamDetailUseCase) {
        self.examId = examId
        self.fetchExamDetailUseCase = fetchExamDetailUseCase
    }

    func load() {
        guard !state.isLoading else {
            return
        }

        Task {
            state.isLoading = true
            state.errorMessage = nil

            do {
                state.detail = try await fetchExamDetailUseCase.execute(examId: examId)
            } catch {
                state.detail = nil
                state.errorMessage = error.localizedDescription
            }

            state.isLoading = false
        }
    }
}
