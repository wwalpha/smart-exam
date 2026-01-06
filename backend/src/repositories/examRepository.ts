import { ExamResultsService } from '../services/ExamResultsService';
import { MaterialsService } from '../services/MaterialsService';
import { ExamResultTable, MaterialTable } from '../types/db';
import { ExamPaper, ExamResult } from './repo.types';
import { createUuid } from '@/lib/uuid';

export const ExamPapersRepository = {
  createExamPaper: async (paper: Omit<ExamPaper, 'paperId'>): Promise<ExamPaper> => {
    const id = createUuid();

    const newPaper: ExamPaper = {
      ...paper,
      paperId: id,
    };

    const dbItem: MaterialTable = {
      materialId: id,
      subjectId: paper.subject,
      title: paper.name,
      questionCount: 0,
      grade: paper.grade,
      category: paper.category,
      questionPdfPath: paper.questionPdfKey,
      answerPdfPath: paper.answerPdfKey,
    };

    await MaterialsService.create(dbItem);

    return newPaper;
  },

  listExamPapers: async (): Promise<ExamPaper[]> => {
    const items = await MaterialsService.list();

    return items
      .filter(
        (m): m is MaterialTable & Required<Pick<MaterialTable, 'grade' | 'category' | 'questionPdfPath' | 'answerPdfPath'>> =>
          Boolean(m.grade && m.category && m.questionPdfPath && m.answerPdfPath)
      )
      .map((m) => ({
        paperId: m.materialId,
        grade: m.grade,
        subject: m.subjectId,
        category: m.category,
        name: m.title,
        questionPdfKey: m.questionPdfPath,
        answerPdfKey: m.answerPdfPath,
      }));
  }
};

export const ExamResultsRepository = {
  createExamResult: async (result: Omit<ExamResult, 'resultId'>): Promise<ExamResult> => {
    const id = createUuid();

    const newResult: ExamResult = {
      ...result,
      resultId: id,
    };

    const dbItem: ExamResultTable = {
      resultId: id,
      paperId: result.paperId || '',
      grade: result.grade,
      subject: result.subject,
      category: result.category,
      name: result.name,
      title: result.title,
      testDate: result.testDate,
      totalScore: result.score ?? 0,
      details: result.details.map((d) => ({ number: d.number, isCorrect: d.isCorrect })),
      gradedImagePath: result.gradedPdfKey,
    };

    await ExamResultsService.create(dbItem);

    return newResult;
  },

  listExamResults: async (): Promise<ExamResult[]> => {
    const items = await ExamResultsService.list();

    return items.map((dbItem) => ({
      resultId: dbItem.resultId,
      paperId: dbItem.paperId,
      grade: dbItem.grade,
      subject: dbItem.subject,
      category: dbItem.category,
      name: dbItem.name,
      title: dbItem.title,
      testDate: dbItem.testDate,
      score: dbItem.totalScore,
      details: dbItem.details.map((d) => ({ number: d.number, isCorrect: d.isCorrect })),
      gradedPdfKey: dbItem.gradedImagePath,
    }));
  }
};
