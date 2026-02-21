import type { Question } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsTable } from '@/types/db';

import type { MaterialQuestionsService } from './materialQuestionsService.types';
import { toSortNumber } from './toSortNumber';

// 内部で利用する処理を定義する
const createQuestionImpl = async (
  repositories: Repositories,
  data: Parameters<MaterialQuestionsService['createQuestion']>[0],
): Promise<Question> => {
  const material = await repositories.materials.get(data.materialId);
  if (!material) {
    throw new ApiError('material not found', 404, ['material_not_found']);
  }
  if (material.isCompleted) {
    // 完了済み教材では設問を変更させない
    throw new ApiError('material is completed', 409, ['material_already_completed']);
  }

  // 内部で利用する処理を定義する
  const id = createUuid();

  const dbItem: MaterialQuestionsTable = {
    questionId: id,
    materialId: data.materialId,
    subjectId: data.subject,
    number: toSortNumber(data.canonicalKey),
    canonicalKey: data.canonicalKey,
    choice: undefined,
  };

  // 非同期処理の完了を待つ
  await repositories.materialQuestions.create(dbItem);
  // 非同期処理の完了を待つ
  await repositories.materials.incrementQuestionCount(data.materialId, 1);

  const item: Question = {
    id,
    ...data,
    choice: undefined,
  };

  // 処理結果を呼び出し元へ返す
  return item;
};

// 公開する処理を定義する
export const createCreateQuestion = (repositories: Repositories): MaterialQuestionsService['createQuestion'] => {
  // 処理結果を呼び出し元へ返す
  return createQuestionImpl.bind(null, repositories);
};
