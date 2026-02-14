import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';
import { toSortNumber } from './toSortNumber';

export const createUpdateQuestion = (repositories: Repositories): QuestionsService['updateQuestion'] => {
  return async (questionId, updates): Promise<Question | null> => {
    const existing = await repositories.questions.get(questionId);
    if (!existing) return null;

    const next = await repositories.questions.update(questionId, {
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
};
