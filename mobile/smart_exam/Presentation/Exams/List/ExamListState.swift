import Foundation

struct ExamListState {
    var exams: [Exam] = []
    var total = 0
    var isLoading = false
    var errorMessage: String?
}
