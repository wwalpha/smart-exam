import type { Question } from '@smart-exam/api-types';

import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialDetailsTable } from '@/types/db';

import type { MaterialDetailsService } from './materialDetails.types';
import { toSortNumber } from './toSortNumber';

const registMaterialDetailImpl = async (
  repositories: Repositories,
  data: Parameters<MaterialDetailsService['registMaterialDetail']>[0],
): Promise<Question> => {
  const id = createUuid();

  const dbItem: MaterialDetailsTable = {
    questionId: id,
    materialId: data.materialId,
    subjectId: data.subject,
    number: toSortNumber(data.canonicalKey),
    canonicalKey: data.canonicalKey,
  };

  await repositories.materialDetails.create(dbItem);
  await repositories.materials.incrementQuestionCount(data.materialId, 1);

  return {
    id,
    canonicalKey: data.canonicalKey,
    subject: data.subject,
    materialId: data.materialId,
    tags: data.tags,
  };
};

export const createRegistMaterialDetail = (
  repositories: Repositories,
): MaterialDetailsService['registMaterialDetail'] => {
  return registMaterialDetailImpl.bind(null, repositories);
};
