import Foundation

enum AppRoute: Hashable {
    case projectList
    case projectDetail(id: Int)
    case pdfViewer(projectId: Int, materialId: Int)
}
