import type { Question } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsTable } from '@/types/db';

import type { QuestionsService } from './createQuestionsService';
import { toSortNumber } from './toSortNumber';

// 内部で利用する処理を定義する
const createQuestionImpl = async (
  repositories: Repositories,
  data: Parameters<QuestionsService['createQuestion']>[0],
): Promise<Question> => {
  // 内部で利用する処理を定義する
  const id = createUuid();

  const dbItem: MaterialQuestionsTable = {
    questionId: id,
    materialId: data.materialId,
    subjectId: data.subject,
    number: toSortNumber(data.canonicalKey),
    canonicalKey: data.canonicalKey,
  };

  // 非同期処理の完了を待つ
  await repositories.materialQuestions.create(dbItem);
  // 非同期処理の完了を待つ
  await repositories.materials.incrementQuestionCount(data.materialId, 1);

  const item: Question = {
    id,
    ...data,
  };

  // 処理結果を呼び出し元へ返す
  return item;
};

// 公開する処理を定義する
export const createCreateQuestion = (repositories: Repositories): QuestionsService['createQuestion'] => {
  // 処理結果を呼び出し元へ返す
  return createQuestionImpl.bind(null, repositories);
};
