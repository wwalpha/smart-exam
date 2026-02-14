import type { QuestionListResponse } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

// 内部で利用する補助処理を定義する
const listQuestionsImpl = async (
  repositories: Repositories,
  materialId: string,
): Promise<QuestionListResponse['datas']> => {
  // 非同期で必要な値を取得する
  const rows = await repositories.questions.listByMaterialId(materialId);
  // 処理結果を呼び出し元へ返す
  return rows.map((q) => ({
    id: q.questionId,
    canonicalKey: q.canonicalKey,
    subject: q.subjectId,
    materialId: q.materialId,
    tags: [],
  }));
};

// 公開するサービス処理を定義する
export const createListQuestions = (repositories: Repositories): QuestionsService['listQuestions'] => {
  // 処理結果を呼び出し元へ返す
  return listQuestionsImpl.bind(null, repositories);
};
