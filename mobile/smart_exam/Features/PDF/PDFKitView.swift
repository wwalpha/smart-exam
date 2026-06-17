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
        applyScrollSettings(to: pdfView)
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

        applyScrollSettings(to: pdfView)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator {
        var documentData: Data?
    }

    private func applyScrollSettings(to pdfView: PDFView) {
        pdfView.displayMode = .singlePageContinuous
        pdfView.displayDirection = .vertical

        guard let scrollView = pdfView.firstSubview(ofType: UIScrollView.self) else {
            return
        }

        scrollView.isScrollEnabled = true
        scrollView.alwaysBounceVertical = true
        scrollView.panGestureRecognizer.minimumNumberOfTouches = 1
    }
}

private extension UIView {
    func firstSubview<T: UIView>(ofType type: T.Type) -> T? {
        if let view = self as? T {
            return view
        }

        for subview in subviews {
            if let view = subview.firstSubview(ofType: type) {
                return view
            }
        }

        return nil
    }
}
