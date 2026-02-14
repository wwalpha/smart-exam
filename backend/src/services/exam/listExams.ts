import type { Exam } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamsService } from './createExamsService';
import { toApiExam } from './internal';

// 内部で利用する補助処理を定義する
const listExamsImpl = async (repositories: Repositories): Promise<Exam[]> => {
  const items: ExamTable[] = await repositories.exams.scanAll();

  // stable ordering: createdDate desc then testId desc
  items.sort((a, b) => {
    // 条件に応じて処理を分岐する
    if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
    // 処理結果を呼び出し元へ返す
    return a.testId < b.testId ? 1 : -1;
  });

  // 処理結果を呼び出し元へ返す
  return items.map(toApiExam);
};

// 公開するサービス処理を定義する
export const createListExams = (repositories: Repositories): ExamsService['listExams'] => {
  // 処理結果を呼び出し元へ返す
  return listExamsImpl.bind(null, repositories);
};
