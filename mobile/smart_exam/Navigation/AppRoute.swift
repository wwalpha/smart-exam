import Foundation

enum AppRoute: Hashable {
    case examList
    case examDetail(id: String)
    case pdfViewer(PDFDocumentDescriptor)
}
