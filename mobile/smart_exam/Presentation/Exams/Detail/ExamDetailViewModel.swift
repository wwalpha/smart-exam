import Combine
import Foundation

@MainActor
final class ExamDetailViewModel: ObservableObject {
    @Published private(set) var state = ExamDetailState()

    private let examId: String
    private let fetchExamDetailUseCase: FetchExamDetailUseCase
    private let checkMaterialPDFAvailabilityUseCase: CheckMaterialPDFAvailabilityUseCase

    init(
        examId: String,
        fetchExamDetailUseCase: FetchExamDetailUseCase,
        checkMaterialPDFAvailabilityUseCase: CheckMaterialPDFAvailabilityUseCase
    ) {
        self.examId = examId
        self.fetchExamDetailUseCase = fetchExamDetailUseCase
        self.checkMaterialPDFAvailabilityUseCase = checkMaterialPDFAvailabilityUseCase
    }

    func load() {
        guard !state.isLoading else {
            return
        }

        Task {
            state.isLoading = true
            state.errorMessage = nil

            do {
                let detail = try await fetchExamDetailUseCase.execute(examId: examId)
                state.detail = detail
                state.materialQuestionPDFAvailability = [:]
                state.isLoading = false
                await loadQuestionPDFAvailability(for: detail)
            } catch {
                state.detail = nil
                state.materialQuestionPDFAvailability = [:]
                state.errorMessage = error.localizedDescription
                state.isLoading = false
            }
        }
    }

    private func loadQuestionPDFAvailability(for detail: ExamDetail) async {
        let materialIds = Array(Set(detail.items.compactMap { $0.materialId?.nilIfBlank })).sorted()

        for materialId in materialIds {
            do {
                let exists = try await checkMaterialPDFAvailabilityUseCase.execute(
                    materialId: materialId,
                    fileType: .question
                )
                state.materialQuestionPDFAvailability[materialId] = exists
            } catch {
                state.materialQuestionPDFAvailability[materialId] = false
            }
        }
    }
}
