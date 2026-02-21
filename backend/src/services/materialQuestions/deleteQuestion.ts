import type { Repositories } from '@/repositories/createRepositories';
import { ApiError } from '@/lib/apiError';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createDeleteQuestion = (repositories: Repositories): MaterialQuestionsService['deleteQuestion'] => {
  return async (materialId, questionId): Promise<boolean> => {
    // 削除対象の設問が存在し、指定教材に属しているかを確認する。
    const existing = await repositories.materialQuestions.get(questionId);
    if (!existing) return false;
    if (existing.materialId !== materialId) return false;

    // 教材の存在確認と削除可否（未完了）を検証する。
    const material = await repositories.materials.get(materialId);
    if (!material) {
      throw new ApiError('material not found', 404, ['material_not_found']);
    }
    if (material.isCompleted) {
      // 完了済み教材では設問を変更させない
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }

    // 設問本体を削除し、教材側の設問数を減算する。
    await repositories.materialQuestions.delete(questionId);
    await repositories.materials.incrementQuestionCount(existing.materialId, -1);

    return true;
  };
};
