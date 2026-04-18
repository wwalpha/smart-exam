import Foundation

struct PDFRepositoryImpl: PDFRepository {
    private let remoteDataSource: PDFRemoteDataSource

    init(remoteDataSource: PDFRemoteDataSource) {
        self.remoteDataSource = remoteDataSource
    }

    func resolve(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor {
        try await remoteDataSource.resolve(descriptor: descriptor)
    }

    func materialFileExists(materialId: String, fileType: PDFMaterialFileType) async throws -> Bool {
        try await remoteDataSource.materialFileExists(materialId: materialId, fileType: fileType)
    }
}
