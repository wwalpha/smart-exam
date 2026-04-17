import Foundation

enum AppRoute: Hashable {
    case projectList
    case projectDetail(id: String)
    case pdfViewer(projectId: String, materialId: Int)
}
