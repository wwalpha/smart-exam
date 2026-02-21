import type { Exam } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamsService } from './index';
import { toApiExam } from './internal';

// 公開するサービス処理を定義する
export const createListExams = (repositories: Repositories): ExamsService['listExams'] => {
  // 処理結果を呼び出し元へ返す
  return async (): Promise<Exam[]> => {
    const items: ExamTable[] = await repositories.exams.scanAll();

    // stable ordering: createdDate desc then examId desc
    items.sort((a, b) => {
      // 条件に応じて処理を分岐する
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      // 処理結果を呼び出し元へ返す
      return a.examId < b.examId ? 1 : -1;
    });

    // 処理結果を呼び出し元へ返す
    return items.map(toApiExam);
  };
};
