import type { Repositories } from '@/repositories/createRepositories';

import { createDeleteMaterialDetail } from './deleteMaterialDetail';
import { createGetMaterialDetail } from './getMaterialDetail';
import { createListMaterialDetails } from './listMaterialDetails';
import { createRegistMaterialDetail } from './registMaterialDetail';
import type { MaterialDetailsService } from './materialDetails.types';
import { createUpdateMaterialDetail } from './updateMaterialDetail';

export const createMaterialDetailsService = (repositories: Repositories): MaterialDetailsService => {
  const listMaterialDetails = createListMaterialDetails(repositories);
  const registMaterialDetail = createRegistMaterialDetail(repositories);
  const getMaterialDetail = createGetMaterialDetail(repositories);
  const updateMaterialDetail = createUpdateMaterialDetail(repositories);
  const deleteMaterialDetail = createDeleteMaterialDetail(repositories);

  return {
    listMaterialDetails,
    registMaterialDetail,
    getMaterialDetail,
    updateMaterialDetail,
    deleteMaterialDetail,
  };
};

export { createMaterialDetailsService as materialDetailsService };
export type { MaterialDetailsService } from './materialDetails.types';
