import type { ListOpenCandidateMaterialsRequest, OpenCandidateMaterial } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import type { Repositories } from '@/repositories/createRepositories';
import type { MaterialTable } from '@/types/db';

import { toApiMaterial } from './materialMappers';
import { sortMaterialsForList } from './material.lib';

const isMaterialRow = (value: MaterialTable | null): value is MaterialTable => {
  return value !== null;
};

export const createListOpenCandidateMaterials = async (
  repositories: Repositories,
  params: ListOpenCandidateMaterialsRequest,
): Promise<OpenCandidateMaterial[]> => {
  // 未来 nextTime を除外した OPEN 候補のみを subject で取得する。
  const dueCandidates = await repositories.examCandidates.listDueCandidates({
    subject: params.subject,
    mode: 'MATERIAL',
    todayYmd: DateUtils.todayYmd(),
  });

  // 候補0件の教材は返却対象外にする。
  const materialIds = Array.from(
    new Set(
      dueCandidates
        .map((candidate) => candidate.materialId)
        .filter((materialId): materialId is string => Boolean(materialId)),
    ),
  );

  if (materialIds.length === 0) {
    return [];
  }

  const candidateCountByMaterialId = dueCandidates.reduce<Map<string, number>>((accumulator, candidate) => {
    if (!candidate.materialId) {
      return accumulator;
    }

    const current = accumulator.get(candidate.materialId) ?? 0;
    accumulator.set(candidate.materialId, current + 1);
    return accumulator;
  }, new Map<string, number>());

  const materialRows = await Promise.all(materialIds.map((materialId) => repositories.materials.get(materialId)));
  const materials = materialRows.filter(isMaterialRow).map(toApiMaterial);
  const sortedMaterials = sortMaterialsForList(materials);

  return sortedMaterials.map((material) => ({
    ...material,
    openCandidateCount: candidateCountByMaterialId.get(material.id) ?? 0,
  }));
};
