import Foundation

struct PDFViewerState {
    var descriptor: PDFDocumentDescriptor?
    var documentData: Data?
    var isLoading = false
    var errorMessage: String?
}
