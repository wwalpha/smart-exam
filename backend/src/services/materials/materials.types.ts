import type {
  CreateMaterialRequest,
  CreateMaterialResponse,
  Material,
  MaterialFile,
  SearchMaterialsRequest,
  SearchMaterialsResponse,
  UploadMaterialFileRequest,
  UploadMaterialFileResponse,
} from '@smart-exam/api-types';

import type { MaterialTable } from '@/types/db';

export type MaterialsService = {
  listMaterials: () => Promise<Material[]>;
  searchMaterials: (params: SearchMaterialsRequest) => Promise<SearchMaterialsResponse>;
  createMaterial: (data: CreateMaterialRequest) => Promise<CreateMaterialResponse>;
  getMaterial: (materialId: string) => Promise<Material | null>;
  updateMaterial: (materialId: string, updates: Partial<MaterialTable>) => Promise<Material | null>;
  deleteMaterial: (materialId: string) => Promise<boolean>;
  listMaterialFiles: (materialId: string) => Promise<MaterialFile[]>;
  uploadMaterialFile: (materialId: string, request: UploadMaterialFileRequest) => Promise<UploadMaterialFileResponse>;
  getMaterialFile: (
    materialId: string,
    fileId: string,
  ) => Promise<{ body: Buffer; contentType: string; filename: string } | null>;
};
