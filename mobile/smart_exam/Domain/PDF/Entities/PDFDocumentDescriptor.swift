import Foundation

enum PDFSourceType: String, Codable, Hashable, Sendable {
    case remote
    case bundled
}

struct PDFDocumentDescriptor: Codable, Hashable, Sendable {
    let id: String
    let title: String
    let url: URL
    let sourceType: PDFSourceType
}
