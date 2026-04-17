import PDFKit
import SwiftUI

struct PDFKitView: UIViewRepresentable {
    let url: URL
    let zoom: Int

    func makeUIView(context: Context) -> PDFView {
        let pdfView = PDFView()
        pdfView.backgroundColor = .white
        pdfView.displayMode = .singlePageContinuous
        pdfView.displayDirection = .vertical
        pdfView.autoScales = false
        pdfView.minScaleFactor = 0.5
        pdfView.maxScaleFactor = 2.0
        pdfView.document = PDFDocument(url: url)
        pdfView.scaleFactor = CGFloat(zoom) / 100
        return pdfView
    }

    func updateUIView(_ pdfView: PDFView, context: Context) {
        if pdfView.document == nil {
            pdfView.document = PDFDocument(url: url)
        }

        let targetScale = CGFloat(zoom) / 100
        if abs(pdfView.scaleFactor - targetScale) > 0.01 {
            pdfView.scaleFactor = targetScale
        }
    }
}
