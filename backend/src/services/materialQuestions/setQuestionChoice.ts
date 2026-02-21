import type { Repositories } from '@/repositories/createRepositories';
import { ApiError } from '@/lib/apiError';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createSetQuestionChoice = (repositories: Repositories): MaterialQuestionsService['setQuestionChoice'] => {
  return async (params): Promise<boolean> => {
    const question = await repositories.materialQuestions.get(params.questionId);
    if (!question) return false;
    if (question.materialId !== params.materialId) return false;

    const material = await repositories.materials.get(params.materialId);
    if (!material) {
      throw new ApiError('material not found', 404, ['material_not_found']);
    }
    if (material.isCompleted) {
      // 完了済み教材では正誤選択を変更させない
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }

    const next = await repositories.materialQuestions.update(params.questionId, {
      choice: params.isCorrect ? 'CORRECT' : 'INCORRECT',
    });

    return next !== null;
  };
};
