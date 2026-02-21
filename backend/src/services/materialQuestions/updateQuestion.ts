import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';
import { toSortNumber } from './toSortNumber';

const updateQuestionImpl = async (
  repositories: Repositories,
  questionId: string,
  updates: Parameters<MaterialQuestionsService['updateQuestion']>[1],
): Promise<Question | null> => {
  const existing = await repositories.materialQuestions.get(questionId);
  if (!existing) return null;

  const next = await repositories.materialQuestions.update(questionId, {
    ...(typeof updates.subject === 'string' ? { subjectId: updates.subject } : {}),
    ...(typeof updates.canonicalKey === 'string'
      ? { canonicalKey: updates.canonicalKey, number: toSortNumber(updates.canonicalKey) }
      : {}),
  });

  if (!next) return null;

  return {
    id: next.questionId,
    canonicalKey: next.canonicalKey,
    subject: next.subjectId,
    materialId: next.materialId,
    tags: updates.tags ?? [],
  };
};

export const createUpdateQuestion = (
  repositories: Repositories,
): MaterialQuestionsService['updateQuestion'] => {
  return updateQuestionImpl.bind(null, repositories);
};
