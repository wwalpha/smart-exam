// 漢字サービスの生成関数と型を再エクスポートする
export { createKanjiService, type KanjiService } from './createKanjiService';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createKanjiService as kanjiService } from './createKanjiService';
