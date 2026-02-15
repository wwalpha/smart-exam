// 復習履歴サービスの生成関数と型を再エクスポートする
export { createReviewAttemptsService } from './createReviewAttemptsService';
export type { ReviewAttemptsService } from './createReviewAttemptsService.types';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createReviewAttemptsService as reviewAttemptsService } from './createReviewAttemptsService';
