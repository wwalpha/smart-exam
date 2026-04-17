import Foundation

protocol PDFRepository {
    func resolve(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor
}
