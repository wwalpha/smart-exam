// 教材サービスの生成関数と型を再エクスポートする
export { createMaterialsService } from './createMaterialsService';
export type { MaterialsService } from './createMaterialsService.types';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createMaterialsService as materialsService } from './createMaterialsService';
