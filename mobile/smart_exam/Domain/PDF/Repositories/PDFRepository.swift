import Foundation

protocol PDFRepository {
    func resolve(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor
    func materialFileExists(materialId: String, fileType: PDFMaterialFileType) async throws -> Bool
}
