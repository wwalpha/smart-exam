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
                let result = try await fetchExamListUseCase.execute(status: ExamStatus.inProgress.rawValue)
                let visibleExams = result.items.filter { $0.status != .completed }
                state.exams = visibleExams
                state.total = visibleExams.count
            } catch {
                state.exams = []
                state.total = 0
                state.errorMessage = error.localizedDescription
            }

            state.isLoading = false
        }
    }
}
