import PDFKit
import SwiftUI

struct PDFKitView: UIViewRepresentable {
    let data: Data
    let zoom: Int

    func makeUIView(context: Context) -> PDFView {
        let pdfView = PDFView()
        pdfView.backgroundColor = .white
        pdfView.displayMode = .singlePageContinuous
        pdfView.displayDirection = .vertical
        pdfView.displaysPageBreaks = false
        pdfView.pageBreakMargins = .zero
        pdfView.autoScales = false
        pdfView.minScaleFactor = 0.5
        pdfView.maxScaleFactor = 2.0
        context.coordinator.documentData = data
        pdfView.document = PDFDocument(data: data)
        pdfView.scaleFactor = CGFloat(zoom) / 100
        if let firstPage = pdfView.document?.page(at: 0) {
            pdfView.go(to: firstPage)
        }
        return pdfView
    }

    func updateUIView(_ pdfView: PDFView, context: Context) {
        if context.coordinator.documentData != data {
            context.coordinator.documentData = data
            pdfView.document = PDFDocument(data: data)
            if let firstPage = pdfView.document?.page(at: 0) {
                pdfView.go(to: firstPage)
            }
        }

        let targetScale = CGFloat(zoom) / 100
        if abs(pdfView.scaleFactor - targetScale) > 0.01 {
            pdfView.scaleFactor = targetScale
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator {
        var documentData: Data?
    }
}
