import type { GetUploadUrlResponse } from '@smart-exam/api-types';

import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';

import type { S3Service } from './createS3Service';

// 公開するサービス処理を定義する
export const createGetUploadUrl = (repositories: Repositories): S3Service['getUploadUrl'] => {
  // 処理結果を呼び出し元へ返す
  return async (params): Promise<GetUploadUrlResponse> => {
    // 処理で使う値を準備する
    const bucket = ENV.FILES_BUCKET_NAME;
    // 条件に応じて処理を分岐する
    if (!bucket) {
      // 処理結果を呼び出し元へ返す
      return { uploadUrl: '', fileKey: '' };
    }

    // 処理で使う値を準備する
    const normalizedPrefix =
      typeof params.prefix === 'string' ? params.prefix.replace(/^\/+/, '').replace(/\/+$/, '') : '';
    // 処理で使う値を準備する
    const base = normalizedPrefix ? normalizedPrefix : 'uploads';

    // 処理で使う値を準備する
    const key = `${base}/${createUuid()}-${params.fileName}`;
    // 非同期で必要な値を取得する
    const url = await repositories.s3.getPresignedPutUrl({
      bucket,
      key,
      contentType: params.contentType,
      expiresInSeconds: 3600,
    });

    // 処理結果を呼び出し元へ返す
    return { uploadUrl: url, fileKey: key };
  };
};
