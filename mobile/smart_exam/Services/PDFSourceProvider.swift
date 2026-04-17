import Foundation

protocol PDFSourceProviding {
    func pdfURL(projectId: Int, materialId: Int) -> URL
}

struct MockRemotePDFSourceProvider: PDFSourceProviding {
    func pdfURL(projectId: Int, materialId: Int) -> URL {
        MockData.material(id: materialId).pdfURL
    }
}
