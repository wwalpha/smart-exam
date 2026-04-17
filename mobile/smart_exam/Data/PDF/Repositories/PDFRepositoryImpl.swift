import Foundation

struct PDFRepositoryImpl: PDFRepository {
    private let remoteDataSource: PDFRemoteDataSource

    init(remoteDataSource: PDFRemoteDataSource) {
        self.remoteDataSource = remoteDataSource
    }

    func resolve(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor {
        try remoteDataSource.resolve(descriptor: descriptor)
    }
}
