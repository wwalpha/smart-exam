import Foundation

enum ExamMapper {
    static func map(_ dto: ExamDTO) -> Exam {
        Exam(
            examId: dto.examId,
            subject: dto.subject,
            mode: dto.mode,
            createdDate: dto.createdDate,
            submittedDate: dto.submittedDate,
            status: dto.status,
            pdf: map(dto.pdf),
            count: dto.count,
            results: dto.results.map(map)
        )
    }

    static func map(_ dto: ExamDetailDTO) -> ExamDetail {
        ExamDetail(
            examId: dto.examId,
            subject: dto.subject,
            mode: dto.mode,
            createdDate: dto.createdDate,
            submittedDate: dto.submittedDate,
            status: dto.status,
            pdf: map(dto.pdf),
            count: dto.count,
            results: dto.results.map(map),
            items: dto.items.map(map)
        )
    }

    private static func map(_ dto: ExamPDFInfoDTO) -> Exam.PDFInfo {
        Exam.PDFInfo(url: dto.url, downloadUrl: dto.downloadUrl)
    }

    private static func map(_ dto: ExamResultDTO) -> Exam.Result {
        Exam.Result(id: dto.id, isCorrect: dto.isCorrect)
    }

    private static func map(_ dto: ExamItemDTO) -> ExamItem {
        ExamItem(
            id: dto.id,
            examId: dto.examId,
            targetType: dto.targetType,
            targetId: dto.targetId,
            displayLabel: dto.displayLabel,
            canonicalKey: dto.canonicalKey,
            kanji: dto.kanji,
            materialId: dto.materialId,
            grade: dto.grade,
            provider: dto.provider,
            materialName: dto.materialName,
            materialDate: dto.materialDate,
            questionText: dto.questionText,
            answerText: dto.answerText,
            correctAnswer: dto.correctAnswer,
            readingHiragana: dto.readingHiragana,
            underlineSpec: dto.underlineSpec.map {
                ExamItem.UnderlineSpec(type: $0.type, start: $0.start, length: $0.length)
            },
            isCorrect: dto.isCorrect,
            itemId: dto.itemId
        )
    }
}
