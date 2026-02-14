// 教材サービスの生成関数と型を再エクスポートする
export { createMaterialsService, type MaterialsService } from './createMaterialsService';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createMaterialsService as materialsService } from './createMaterialsService';
