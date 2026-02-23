import type { Services } from '@/services/createServices';
import { completeMaterial } from './completeMaterial';
import { createMaterial } from './createMaterial';
import { deleteMaterial } from './deleteMaterial';
import { getMaterial } from './getMaterial';
import { getMaterialFile } from './getMaterialFile';
import { listMaterialFiles } from './listMaterialFiles';
import { listMaterials } from './listMaterials';
import { searchMaterials } from './searchMaterials';
import { uploadMaterialFile } from './uploadMaterialFile';
import { updateMaterial } from './updateMaterial';
import {
  CreateMaterialBodySchema,
  SearchMaterialsBodySchema,
  UpdateMaterialBodySchema,
  UploadMaterialFileBodySchema,
} from './materials.schema';

export const materialsController = (services: Services) => {
  return {
    CreateMaterialBodySchema,
    SearchMaterialsBodySchema,
    UpdateMaterialBodySchema,
    UploadMaterialFileBodySchema,
    listMaterials: listMaterials(services),
    searchMaterials: searchMaterials(services),
    createMaterial: createMaterial(services),
    completeMaterial: completeMaterial(services),
    getMaterial: getMaterial(services),
    updateMaterial: updateMaterial(services),
    deleteMaterial: deleteMaterial(services),
    listMaterialFiles: listMaterialFiles(services),
    getMaterialFile: getMaterialFile(services),
    uploadMaterialFile: uploadMaterialFile(services),
  };
};
