// 問題サービスの生成関数と型を再エクスポートする
export { createQuestionsService } from './createQuestionsService';
export type { QuestionsService } from './createQuestionsService.types';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createQuestionsService as questionsService } from './createQuestionsService';
