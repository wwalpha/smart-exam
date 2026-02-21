import type { Question } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsTable } from '@/types/db';

import type { MaterialQuestionsService } from './materialQuestions.types';
import { toSortNumber } from './materialQuestions.lib';

export const createCreateQuestion = (repositories: Repositories): MaterialQuestionsService['createQuestion'] => {
  return async (data): Promise<Question> => {
    const material = await repositories.materials.get(data.materialId);
    if (!material) {
      throw new ApiError('material not found', 404, ['material_not_found']);
    }
    if (material.isCompleted) {
      // 完了済み教材では設問を変更させない
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }

    const id = createUuid();

    const dbItem: MaterialQuestionsTable = {
      questionId: id,
      materialId: data.materialId,
      subjectId: material.subjectId,
      number: toSortNumber(data.canonicalKey),
      canonicalKey: data.canonicalKey,
      choice: 'CORRECT',
    };

    await repositories.materialQuestions.create(dbItem);
    await repositories.materials.incrementQuestionCount(data.materialId, 1);

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
