import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialDetailsService } from './materialDetails.types';

const listMaterialDetailsImpl = async (repositories: Repositories, materialId: string): Promise<Question[]> => {
  const rows = await repositories.materialDetails.listByMaterialId(materialId);
  return rows.map((row) => ({
    id: row.questionId,
    canonicalKey: row.canonicalKey,
    subject: row.subjectId,
    materialId: row.materialId,
    tags: [],
  }));
};

export const createListMaterialDetails = (
  repositories: Repositories,
): MaterialDetailsService['listMaterialDetails'] => {
  return listMaterialDetailsImpl.bind(null, repositories);
};
