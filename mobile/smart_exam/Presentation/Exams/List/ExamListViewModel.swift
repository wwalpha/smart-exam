import Combine
import Foundation

@MainActor
final class ExamListViewModel: ObservableObject {
    @Published private(set) var state = ExamListState()

    private let fetchExamListUseCase: FetchExamListUseCase

    init(fetchExamListUseCase: FetchExamListUseCase) {
        self.fetchExamListUseCase = fetchExamListUseCase
    }

    func load() {
        guard !state.isLoading else {
            return
        }

        Task {
            state.isLoading = true
            state.errorMessage = nil

            do {
                let result = try await fetchExamListUseCase.execute()
                state.exams = result.items
                state.total = result.total
            } catch {
                state.exams = []
                state.total = 0
                state.errorMessage = error.localizedDescription
            }

            state.isLoading = false
        }
    }
}
