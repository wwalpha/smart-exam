import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './materials.types';

// 公開する処理を定義する
export const createGetMaterialFile = (
  repositories: Repositories,
  deps: {
    listMaterialFiles: MaterialsService['listMaterialFiles'];
  },
): MaterialsService['getMaterialFile'] => {
  // 処理結果を呼び出し元へ返す
  return async (materialId: string, fileId: string): ReturnType<MaterialsService['getMaterialFile']> => {
    // 内部で利用する処理を定義する
    const bucket = ENV.FILES_BUCKET_NAME;
    // 条件に応じて処理を分岐する
    if (!bucket) return null;

    // 内部で利用する処理を定義する
    const files = await deps.listMaterialFiles(materialId);
    // 内部で利用する処理を定義する
    const target = files.find((f) => f.id === fileId);
    // 条件に応じて処理を分岐する
    if (!target) return null;

    // 内部で利用する処理を定義する
    const s3Key = target.s3Key;
    // 内部で利用する処理を定義する
    const filename = target.filename || s3Key.split('/').pop() || 'file.pdf';

    const { buffer, contentType: responseContentType } = await repositories.s3.getObjectBuffer({ bucket, key: s3Key });
    // 内部で利用する処理を定義する
    const body = buffer;
    // 内部で利用する処理を定義する
    const contentType =
      responseContentType || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

    // 処理結果を呼び出し元へ返す
    return { body, contentType, filename };
  };
};
