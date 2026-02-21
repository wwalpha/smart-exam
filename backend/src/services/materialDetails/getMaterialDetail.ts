import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialDetailsService } from './materialDetails.types';

const getMaterialDetailImpl = async (repositories: Repositories, questionId: string): Promise<Question | null> => {
  const row = await repositories.materialDetails.get(questionId);
  if (!row) return null;

  return {
    id: row.questionId,
    canonicalKey: row.canonicalKey,
    subject: row.subjectId,
    materialId: row.materialId,
    tags: [],
  };
};

export const createGetMaterialDetail = (repositories: Repositories): MaterialDetailsService['getMaterialDetail'] => {
  return getMaterialDetailImpl.bind(null, repositories);
};
