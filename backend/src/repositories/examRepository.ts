import { ExamPapersService } from '../services/ExamPapersService';
import { ExamResultsService } from '../services/ExamResultsService';
import { ExamPaperTable, ExamResultTable } from '../types/db';
import { ExamPaper, ExamResult } from './repo.types';
import { randomUUID } from 'crypto';
import { DateUtils } from '@/lib/dateUtils';

export const ExamPapersRepository = {
  createExamPaper: async (paper: Omit<ExamPaper, 'paperId' | 'createdAt'>): Promise<ExamPaper> => {
    const id = randomUUID();
    const now = DateUtils.now();

    const newPaper: ExamPaper = {
      ...paper,
      paperId: id,
      createdAt: now,
    };

    const dbItem: ExamPaperTable = {
      paperId: id,
      grade: paper.grade,
      subject: paper.subject,
      category: paper.category,
      name: paper.name,
      questionPdfPath: paper.questionPdfKey,
      answerPdfPath: paper.answerPdfKey,
      createdAt: now,
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
      createdAt: dbItem.createdAt,
    }));
  }
};

export const ExamResultsRepository = {
  createExamResult: async (result: Omit<ExamResult, 'resultId' | 'createdAt'>): Promise<ExamResult> => {
    const id = randomUUID();
    const now = DateUtils.now();

    const newResult: ExamResult = {
      ...result,
      resultId: id,
      createdAt: now,
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
      createdAt: now,
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
      createdAt: dbItem.createdAt,
    }));
  }
};
