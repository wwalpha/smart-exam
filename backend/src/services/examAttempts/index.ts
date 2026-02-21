// 復習履歴サービスの生成関数と型を再エクスポートする
export { createExamAttemptsService } from './createExamAttemptsService';
export type { ExamAttemptsService } from './createExamAttemptsService.types';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createExamAttemptsService as examAttemptsService } from './createExamAttemptsService';

// 互換用エイリアス
export { createExamAttemptsService as createReviewAttemptsService } from './createExamAttemptsService';
export type { ExamAttemptsService as ReviewAttemptsService } from './createExamAttemptsService.types';
export { createExamAttemptsService as reviewAttemptsService } from './createExamAttemptsService';
