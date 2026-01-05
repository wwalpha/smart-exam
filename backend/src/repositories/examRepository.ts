import { ExamPapersService } from '../services/ExamPapersService';
import { ExamResultsService } from '../services/ExamResultsService';
import { ExamPaperTable, ExamResultTable } from '../types/db';
import { ExamPaper, ExamResult } from './repo.types';
import { createUuid } from '@/lib/uuid';

export const ExamPapersRepository = {
  createExamPaper: async (paper: Omit<ExamPaper, 'paperId'>): Promise<ExamPaper> => {
    const id = createUuid();

    const newPaper: ExamPaper = {
      ...paper,
      paperId: id,
    };

    const dbItem: ExamPaperTable = {
      paperId: id,
      grade: paper.grade,
      subject: paper.subject,
      category: paper.category,
      name: paper.name,
      questionPdfPath: paper.questionPdfKey,
      answerPdfPath: paper.answerPdfKey,
    };

    await ExamPapersService.create(dbItem);

    return newPaper;
  },

  listExamPapers: async (): Promise<ExamPaper[]> => {
    const items = await ExamPapersService.list();

    return items.map((dbItem) => ({
      paperId: dbItem.paperId,
      grade: dbItem.grade,
      subject: dbItem.subject,
      category: dbItem.category,
      name: dbItem.name,
      questionPdfKey: dbItem.questionPdfPath,
      answerPdfKey: dbItem.answerPdfPath,
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
