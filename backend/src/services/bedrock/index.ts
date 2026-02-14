// Bedrockサービスの生成関数と型を再エクスポートする
export { createBedrockService, type BedrockService } from './createBedrockService';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createBedrockService as bedrockService } from './createBedrockService';
