import type { MaterialFile } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './materials.types';

// 公開する処理を定義する
export const createListMaterialFiles = (repositories: Repositories): MaterialsService['listMaterialFiles'] => {
  // 処理結果を呼び出し元へ返す
  return async (materialId: string): Promise<MaterialFile[]> => {
    // 内部で利用する処理を定義する
    const bucket = ENV.FILES_BUCKET_NAME;
    // 条件に応じて処理を分岐する
    if (!bucket) return [];

    // 内部で利用する処理を定義する
    const prefix = `materials/${materialId}/`;
    // 内部で利用する処理を定義する
    const objects = await repositories.s3.listObjectsByPrefix({ bucket, prefix });
    const material = await repositories.materials.get(materialId);

    const filePathByType: Partial<Record<MaterialFile['fileType'], string>> = {
      QUESTION: material?.questionPdfPath,
      ANSWER: material?.answerPdfPath,
      GRADED_ANSWER: material?.answerSheetPath,
    };

    const fileNameByType: Partial<Record<MaterialFile['fileType'], string>> = {
      QUESTION: material?.questionPdfFilename,
      ANSWER: material?.answerPdfFilename,
      GRADED_ANSWER: material?.answerSheetFilename,
    };

    // 内部で利用する処理を定義する
    const now = DateUtils.now();
    // 内部で利用する処理を定義する
    const allowedTypes = new Set<MaterialFile['fileType']>(['QUESTION', 'ANSWER', 'GRADED_ANSWER']);

    // 処理結果を呼び出し元へ返す
    return objects
      .map((obj) => {
        // 内部で利用する処理を定義する
        const key = obj.key;
        // 条件に応じて処理を分岐する
        if (!key || key.endsWith('/')) return null;

        // 内部で利用する処理を定義する
        const parts = key.split('/');
        // 条件に応じて処理を分岐する
        if (parts.length < 4) return null;
        // 内部で利用する処理を定義する
        const fileTypeRaw = parts[2] as MaterialFile['fileType'];
        // 条件に応じて処理を分岐する
        if (!allowedTypes.has(fileTypeRaw)) return null;

        // 内部で利用する処理を定義する
        const baseName = parts.slice(3).join('/');
        // 内部で利用する処理を定義する
        const dashIndex = baseName.indexOf('-');
        // 内部で利用する処理を定義する
        const id = dashIndex > 0 ? baseName.slice(0, dashIndex) : baseName;
        const mappedPath = filePathByType[fileTypeRaw];
        const mappedName = fileNameByType[fileTypeRaw];
        // ファイル名をS3キーへ含めない新フォーマットでも表示名を復元できるようにする
        const filename =
          dashIndex > 0
            ? baseName.slice(dashIndex + 1)
            : mappedPath === key && typeof mappedName === 'string' && mappedName.length > 0
              ? mappedName
              : baseName;

        // 内部で利用する処理を定義する
        const contentType = filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';
        // 内部で利用する処理を定義する
        const createdAt = obj.lastModified ? DateUtils.format(obj.lastModified) : now;

        const item: MaterialFile = {
          id,
          materialId,
          filename,
          s3Key: key,
          contentType,
          fileType: fileTypeRaw,
          createdAt,
        };
        // 処理結果を呼び出し元へ返す
        return item;
      })
      .filter((x): x is MaterialFile => x !== null);
  };
};
