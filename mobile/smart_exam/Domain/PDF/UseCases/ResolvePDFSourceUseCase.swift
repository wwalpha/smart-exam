import Foundation

struct ResolvePDFSourceUseCase {
    private let repository: any PDFRepository

    init(repository: any PDFRepository) {
        self.repository = repository
    }

    func execute(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor {
        try await repository.resolve(descriptor: descriptor)
    }
}
