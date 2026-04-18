import Combine
import Foundation
import os
import PDFKit

@MainActor
final class PDFViewerViewModel: ObservableObject {
    @Published private(set) var state = PDFViewerState()

    let initialDescriptor: PDFDocumentDescriptor
    private let resolvePDFSourceUseCase: ResolvePDFSourceUseCase
    private let urlSession: URLSession
    private let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "smart_exam", category: "PDFViewer")

    init(
        descriptor: PDFDocumentDescriptor,
        resolvePDFSourceUseCase: ResolvePDFSourceUseCase,
        urlSession: URLSession = .shared
    ) {
        self.initialDescriptor = descriptor
        self.resolvePDFSourceUseCase = resolvePDFSourceUseCase
        self.urlSession = urlSession
    }

    func load() {
        guard !state.isLoading, state.documentData == nil else {
            return
        }

        Task {
            state.isLoading = true
            state.errorMessage = nil

            do {
                let descriptor = try await resolvePDFSourceUseCase.execute(descriptor: initialDescriptor)
                guard let url = descriptor.url else {
                    throw PDFViewerError.missingURL
                }

                let data = try await downloadPDF(from: url)
                state.descriptor = descriptor
                state.documentData = data
            } catch {
                state.descriptor = nil
                state.documentData = nil
                state.errorMessage = error.localizedDescription
            }

            state.isLoading = false
        }
    }

    private func downloadPDF(from url: URL) async throws -> Data {
        guard ["http", "https"].contains(url.scheme?.lowercased()) else {
            throw PDFViewerError.unsupportedURL
        }

        log("PDF download start url=\(url.absoluteString)")
        let (data, response) = try await urlSession.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw PDFViewerError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            throw PDFViewerError.httpStatus(httpResponse.statusCode)
        }

        guard !data.isEmpty else {
            throw PDFViewerError.emptyData
        }

        guard PDFDocument(data: data) != nil else {
            throw PDFViewerError.invalidPDF
        }

        let contentType = httpResponse.value(forHTTPHeaderField: "Content-Type") ?? "unknown"
        log("PDF download succeeded url=\(url.absoluteString) status=\(httpResponse.statusCode) contentType=\(contentType) bytes=\(data.count)")
        return data
    }

    private func log(_ message: String) {
        logger.debug("\(message, privacy: .public)")
        print("[PDFViewer] \(message)")
    }
}

private enum PDFViewerError: LocalizedError {
    case invalidResponse
    case httpStatus(Int)
    case emptyData
    case invalidPDF
    case unsupportedURL
    case missingURL

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "PDFのレスポンスが不正です"
        case .httpStatus(let statusCode):
            return "PDFの取得に失敗しました: HTTP \(statusCode)"
        case .emptyData:
            return "PDFのデータが空です"
        case .invalidPDF:
            return "PDFの形式が不正です"
        case .unsupportedURL:
            return "PDFのURL形式に対応していません"
        case .missingURL:
            return "PDFのURLが取得できませんでした"
        }
    }
}
