import Foundation

struct ExamDetailState {
    var detail: ExamDetail?
    var materialQuestionPDFAvailability: [String: Bool] = [:]
    var isLoading = false
    var errorMessage: String?
}
