import Foundation
import os

struct PDFRemoteDataSource {
    private let apiClient: APIClient
    private let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "smart_exam", category: "PDFRemoteDataSource")

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func resolve(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor {
        switch descriptor.sourceType {
        case .remote, .bundled:
            return descriptor
        case .materialFile:
            return try await resolveMaterialFile(descriptor: descriptor)
        }
    }

    func materialFileExists(materialId: String, fileType: PDFMaterialFileType) async throws -> Bool {
        guard let materialId = materialId.nilIfBlank else {
            return false
        }

        let filesResponse = try await listMaterialFiles(materialId: materialId, fileType: fileType)
        return Self.pickLatestFile(from: filesResponse.datas, fileType: fileType) != nil
    }

    private func resolveMaterialFile(descriptor: PDFDocumentDescriptor) async throws -> PDFDocumentDescriptor {
        guard let materialId = descriptor.materialId?.nilIfBlank,
              let materialFileType = descriptor.materialFileType else {
            throw PDFRemoteDataSourceError.missingMaterialFileSource
        }

        let encodedMaterialId = Self.encodePathComponent(materialId)
        let filesResponse = try await listMaterialFiles(materialId: materialId, fileType: materialFileType)

        guard let file = Self.pickLatestFile(from: filesResponse.datas, fileType: materialFileType) else {
            throw PDFRemoteDataSourceError.materialFileNotFound(materialFileType.rawValue)
        }

        let encodedFileId = Self.encodePathComponent(file.id)
        let downloadPath = "/api/materials/\(encodedMaterialId)/files/\(encodedFileId)"
        log("get material file download url materialId=\(materialId) fileId=\(file.id) path=\(downloadPath)")

        let downloadResponse: MaterialFileDownloadDTO = try await apiClient.getDecodable(
            path: downloadPath,
            requiresAuthorization: true
        )

        guard let downloadURL = URL(string: downloadResponse.downloadUrl),
              ["http", "https"].contains(downloadURL.scheme?.lowercased()) else {
            throw PDFRemoteDataSourceError.invalidDownloadURL
        }

        log("resolved material pdf materialId=\(materialId) fileId=\(file.id) url=\(downloadURL.absoluteString)")
        return descriptor.resolved(url: downloadURL)
    }

    private func listMaterialFiles(materialId: String, fileType: PDFMaterialFileType) async throws -> MaterialFilesResponseDTO {
        let encodedMaterialId = Self.encodePathComponent(materialId)
        let listPath = "/api/materials/\(encodedMaterialId)/files"
        log("list material files materialId=\(materialId) fileType=\(fileType.rawValue) path=\(listPath)")

        return try await apiClient.getDecodable(
            path: listPath,
            requiresAuthorization: true
        )
    }

    private static func pickLatestFile(from files: [MaterialFileDTO], fileType: PDFMaterialFileType) -> MaterialFileDTO? {
        files
            .filter { file in
                file.fileType == fileType.rawValue && file.contentType.lowercased().contains("pdf")
            }
            .sorted { lhs, rhs in
                lhs.createdAt > rhs.createdAt
            }
            .first
    }

    private static func encodePathComponent(_ value: String) -> String {
        var allowed = CharacterSet.urlPathAllowed
        allowed.remove(charactersIn: "/")
        return value.addingPercentEncoding(withAllowedCharacters: allowed) ?? value
    }

    private func log(_ message: String) {
        logger.debug("\(message, privacy: .public)")
        print("[PDFRemoteDataSource] \(message)")
    }
}

private struct MaterialFilesResponseDTO: Decodable {
    let datas: [MaterialFileDTO]
}

private struct MaterialFileDTO: Decodable {
    let id: String
    let materialId: String
    let filename: String
    let s3Key: String
    let contentType: String
    let fileType: String
    let createdAt: String
}

private struct MaterialFileDownloadDTO: Decodable {
    let downloadUrl: String
}

private enum PDFRemoteDataSourceError: LocalizedError {
    case missingMaterialFileSource
    case materialFileNotFound(String)
    case invalidDownloadURL

    var errorDescription: String? {
        switch self {
        case .missingMaterialFileSource:
            return "教材PDFの取得情報が不足しています"
        case .materialFileNotFound(let fileType):
            return "\(fileType) PDFが見つかりません"
        case .invalidDownloadURL:
            return "PDFのダウンロードURLが不正です"
        }
    }
}
