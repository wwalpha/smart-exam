import Combine
import Foundation

@MainActor
final class PDFViewerViewModel: ObservableObject {
    @Published private(set) var state = PDFViewerState()

    let initialDescriptor: PDFDocumentDescriptor
    private let resolvePDFSourceUseCase: ResolvePDFSourceUseCase

    init(
        descriptor: PDFDocumentDescriptor,
        resolvePDFSourceUseCase: ResolvePDFSourceUseCase
    ) {
        self.initialDescriptor = descriptor
        self.resolvePDFSourceUseCase = resolvePDFSourceUseCase
    }

    func load() {
        guard !state.isLoading else {
            return
        }

        Task {
            state.isLoading = true
            state.errorMessage = nil

            do {
                state.descriptor = try await resolvePDFSourceUseCase.execute(descriptor: initialDescriptor)
            } catch {
                state.descriptor = nil
                state.errorMessage = error.localizedDescription
            }

            state.isLoading = false
        }
    }
}
