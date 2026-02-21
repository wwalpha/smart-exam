import type { Exam } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamsService } from './index';
import { toApiExam } from './internal';

// すべての試験を新しい順で一覧返却する。
export const createListExams = (repositories: Repositories): ExamsService['listExams'] => {
  return async (): Promise<Exam[]> => {
    const items: ExamTable[] = await repositories.exams.scanAll();

    // 同日作成分は examId で順序を固定し、取得順の揺れを防ぐ。
    items.sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      return a.examId < b.examId ? 1 : -1;
    });
    return items.map(toApiExam);
  };
};
