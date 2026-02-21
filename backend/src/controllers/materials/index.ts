import type { Services } from '@/services/createServices';
import { createMaterial } from './createMaterial';
import { deleteMaterial } from './deleteMaterial';
import { getMaterial } from './getMaterial';
import { getMaterialFile } from './getMaterialFile';
import { listMaterialFiles } from './listMaterialFiles';
import { listMaterials } from './listMaterials';
import { searchMaterials } from './searchMaterials';
import { updateMaterial } from './updateMaterial';
import { CreateMaterialBodySchema, SearchMaterialsBodySchema, UpdateMaterialBodySchema } from './materials.schema';

export const materialsController = (services: Services) => {
  return {
    CreateMaterialBodySchema,
    SearchMaterialsBodySchema,
    UpdateMaterialBodySchema,
    listMaterials: listMaterials(services),
    searchMaterials: searchMaterials(services),
    createMaterial: createMaterial(services),
    getMaterial: getMaterial(services),
    updateMaterial: updateMaterial(services),
    deleteMaterial: deleteMaterial(services),
    listMaterialFiles: listMaterialFiles(services),
    getMaterialFile: getMaterialFile(services),
  };
};
