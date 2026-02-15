// S3サービスの生成関数と型を再エクスポートする
export { createS3Service } from './createS3Service';
export type { S3Service } from './createS3Service.types';

// 既存参照向けに別名のサービス生成関数を再エクスポートする
export { createS3Service as s3Service } from './createS3Service';
