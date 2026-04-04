import type { QuestionListResponse } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialQuestionsTable } from '@/types/db';

import type { MaterialQuestionsService } from './materialQuestions.types';
import { toSortNumber } from './materialQuestions.lib';

const toApiQuestions = (rows: MaterialQuestionsTable[]): QuestionListResponse['datas'] => {
  return rows.map((row) => ({
    id: row.questionId,
    canonicalKey: row.canonicalKey,
    subject: row.subjectId,
    materialId: row.materialId,
    choice: row.choice,
    correctAnswer: row.correctAnswer,
    tags: [],
  }));
};

export const createCreateQuestionsBulk = (
  repositories: Repositories,
): MaterialQuestionsService['createQuestionsBulk'] => {
  return async ({ materialId, items }): Promise<QuestionListResponse['datas']> => {
    const material = await repositories.materials.get(materialId);
    if (!material) {
      throw new ApiError('material not found', 404, ['material_not_found']);
    }
    if (material.isCompleted) {
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }
    if (items.length === 0) {
      return await toApiQuestions(await repositories.materialQuestions.listByMaterialId(materialId));
    }

    const dbItems: MaterialQuestionsTable[] = items.map((item) => ({
      questionId: createUuid(),
      materialId,
      subjectId: material.subjectId,
      number: toSortNumber(item.canonicalKey),
      canonicalKey: item.canonicalKey,
      choice: 'CORRECT',
    }));

    await repositories.materialQuestions.bulkCreate(dbItems);
    await repositories.materials.incrementQuestionCount(materialId, dbItems.length);

    const rows = await repositories.materialQuestions.listByMaterialId(materialId);
    return toApiQuestions(rows);
  };
};
