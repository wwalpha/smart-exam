import { createMaterial } from './createMaterial';
import { deleteMaterial } from './deleteMaterial';
import { getMaterial } from './getMaterial';
import { getMaterialFile } from './getMaterialFile';
import { listMaterialFiles } from './listMaterialFiles';
import { listMaterials } from './listMaterials';
import { updateMaterial } from './updateMaterial';

export { createMaterial, deleteMaterial, getMaterial, getMaterialFile, listMaterialFiles, listMaterials, updateMaterial };

export const MaterialRepository = {
  createMaterial,
  getMaterial,
  listMaterials,
  updateMaterial,
  deleteMaterial,
  listMaterialFiles,
  getMaterialFile,
};
