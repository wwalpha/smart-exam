// 試験サービスの生成関数と型を再エクスポートする
export { createExamsService } from './createExamsService';
export type { ExamsService } from './createExamsService.types';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createExamsService as examsService } from './createExamsService';
