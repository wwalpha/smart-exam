import Foundation

protocol PDFSourceProviding {
    func pdfURL(projectId: String, materialId: Int) -> URL
}

struct MockRemotePDFSourceProvider: PDFSourceProviding {
    func pdfURL(projectId: String, materialId: Int) -> URL {
        MockData.material(id: materialId).pdfURL
    }
}
