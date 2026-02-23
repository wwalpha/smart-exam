import type {
  AnalyzeMaterialResponse,
  CreateMaterialRequest,
  CreateMaterialResponse,
  ListOpenCandidateMaterialsRequest,
  Material,
  MaterialFile,
  OpenCandidateMaterial,
  SearchMaterialsRequest,
  SearchMaterialsResponse,
  UploadMaterialFileRequest,
  UploadMaterialFileResponse,
} from '@smart-exam/api-types';

import type { MaterialTable } from '@/types/db';

export type MaterialsService = {
  listMaterials: () => Promise<Material[]>;
  listOpenCandidateMaterials: (params: ListOpenCandidateMaterialsRequest) => Promise<OpenCandidateMaterial[]>;
  searchMaterials: (params: SearchMaterialsRequest) => Promise<SearchMaterialsResponse>;
  createMaterial: (data: CreateMaterialRequest) => Promise<CreateMaterialResponse>;
  getMaterial: (materialId: string) => Promise<Material | null>;
  updateMaterial: (materialId: string, updates: Partial<MaterialTable>) => Promise<Material | null>;
  deleteMaterial: (materialId: string) => Promise<boolean>;
  listMaterialFiles: (materialId: string) => Promise<MaterialFile[]>;
  uploadMaterialFile: (materialId: string, request: UploadMaterialFileRequest) => Promise<UploadMaterialFileResponse>;
  analyzeMaterial: (materialId: string) => Promise<AnalyzeMaterialResponse>;
  getMaterialFile: (
    materialId: string,
    fileId: string,
  ) => Promise<{ downloadUrl: string } | null>;
};
