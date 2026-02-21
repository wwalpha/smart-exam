import type { ExamMode, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable } from '@/types/db';

import type { ExamsService } from './index';

// 内部で利用する補助処理を定義する
const listExamCandidatesImpl = async (
  repositories: Repositories,
  params: { subject?: SubjectId; mode?: ExamMode },
): Promise<ExamCandidateTable[]> => {
  // 処理結果を呼び出し元へ返す
  return await repositories.examCandidates.listCandidates(params);
};

// 公開するサービス処理を定義する
export const createListExamCandidates = (
  repositories: Repositories,
): ExamsService['listExamCandidates'] => {
  // 処理結果を呼び出し元へ返す
  return listExamCandidatesImpl.bind(null, repositories);
};
