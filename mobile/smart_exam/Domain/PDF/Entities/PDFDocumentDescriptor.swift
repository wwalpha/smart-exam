import Foundation

enum PDFSourceType: String, Codable, Hashable, Sendable {
    case remote
    case bundled
    case materialFile
}

enum PDFMaterialFileType: String, Codable, Hashable, Sendable {
    case question = "QUESTION"
    case answer = "ANSWER"
}

struct PDFDocumentDescriptor: Codable, Hashable, Sendable {
    let id: String
    let title: String
    let url: URL?
    let sourceType: PDFSourceType
    let materialId: String?
    let materialFileType: PDFMaterialFileType?

    init(
        id: String,
        title: String,
        url: URL? = nil,
        sourceType: PDFSourceType,
        materialId: String? = nil,
        materialFileType: PDFMaterialFileType? = nil
    ) {
        self.id = id
        self.title = title
        self.url = url
        self.sourceType = sourceType
        self.materialId = materialId
        self.materialFileType = materialFileType
    }

    func resolved(url: URL) -> PDFDocumentDescriptor {
        PDFDocumentDescriptor(
            id: id,
            title: title,
            url: url,
            sourceType: sourceType,
            materialId: materialId,
            materialFileType: materialFileType
        )
    }
}
