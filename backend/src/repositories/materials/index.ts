import { createMaterial } from './createMaterial';
import { deleteMaterial } from './deleteMaterial';
import { getMaterial } from './getMaterial';
import { getMaterialFile } from './getMaterialFile';
import { listMaterialFiles } from './listMaterialFiles';
import { listMaterials } from './listMaterials';

export { createMaterial, deleteMaterial, getMaterial, getMaterialFile, listMaterialFiles, listMaterials };

export const MaterialRepository = {
  createMaterial,
  getMaterial,
  listMaterials,
  deleteMaterial,
  listMaterialFiles,
  getMaterialFile,
};
