import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createSetMaterialChoices = (repositories: Repositories): MaterialQuestionsService['setMaterialChoices'] => {
  return async (params): Promise<boolean> => {
    const material = await repositories.materials.get(params.materialId);
    if (!material) {
      throw new ApiError('material not found', 404, ['material_not_found']);
    }
    if (material.isCompleted) {
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }

    const rows = await repositories.materialQuestions.listByMaterialId(params.materialId);
    const existingByQuestionId = new Map(rows.map((row) => [row.questionId, row] as const));

    for (const item of params.items) {
      const existing = existingByQuestionId.get(item.questionId);
      if (!existing) {
        return false;
      }
    }

    await repositories.materialQuestions.bulkUpdateChoices(
      params.items.map((item) => ({
        questionId: item.questionId,
        isCorrect: item.isCorrect,
        correctAnswer: item.correctAnswer,
      })),
    );

    return true;
  };
};