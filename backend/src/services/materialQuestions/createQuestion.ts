import type { Question } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsTable } from '@/types/db';

import type { MaterialQuestionsService } from './materialQuestions.types';
import { toSortNumber } from './materialQuestions.lib';

export const createCreateQuestion = (repositories: Repositories): MaterialQuestionsService['createQuestion'] => {
  return async (data): Promise<Question> => {
    // 先に教材の存在を確認し、関連情報（subjectId）を取得する。
    const material = await repositories.materials.get(data.materialId);
    if (!material) {
      throw new ApiError('material not found', 404, ['material_not_found']);
    }
    if (material.isCompleted) {
      // 完了済み教材では設問を変更させない
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }

    // 設問IDを採番する。
    const id = createUuid();

    // DB保存用に、canonicalKey から並び順番号を計算して保持する。
    const dbItem: MaterialQuestionsTable = {
      questionId: id,
      materialId: data.materialId,
      subjectId: material.subjectId,
      number: toSortNumber(data.canonicalKey),
      canonicalKey: data.canonicalKey,
      choice: 'CORRECT',
    };

    // 設問作成と教材側の設問数更新を行う。
    await repositories.materialQuestions.create(dbItem);
    await repositories.materials.incrementQuestionCount(data.materialId, 1);

    // APIレスポンス形式へ整形して返す。
    return {
      id,
      canonicalKey: data.canonicalKey,
      subject: material.subjectId,
      materialId: data.materialId,
      tags: data.tags,
      choice: 'CORRECT',
    };
  };
};
