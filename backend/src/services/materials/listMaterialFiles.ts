import type { MaterialFile } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

const MATERIAL_FILE_TYPES: MaterialFile['fileType'][] = ['QUESTION', 'ANSWER', 'GRADED_ANSWER'];

const UUID_V4_LIKE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const extractFileId = (baseName: string): string => {
  if (UUID_V4_LIKE_PATTERN.test(baseName)) {
    return baseName;
  }

  const dashIndex = baseName.indexOf('-');
  return dashIndex > 0 ? baseName.slice(0, dashIndex) : baseName;
};

const extractFilename = (baseName: string, mappedName: string | undefined): string => {
  if (UUID_V4_LIKE_PATTERN.test(baseName)) {
    return typeof mappedName === 'string' && mappedName.length > 0 ? mappedName : 'file.pdf';
  }

  const dashIndex = baseName.indexOf('-');
  if (dashIndex > 0) {
    return baseName.slice(dashIndex + 1);
  }

  return typeof mappedName === 'string' && mappedName.length > 0 ? mappedName : baseName;
};

type ListedObject = {
  key?: string;
  lastModified?: Date;
};

type ObjectWithType = {
  key: string;
  fileType: MaterialFile['fileType'];
  baseName: string;
  lastModified?: Date;
};

const parseObjectWithType = (object: ListedObject): ObjectWithType | null => {
  const key = object.key;
  if (!key || key.endsWith('/')) return null;

  const parts = key.split('/');
  if (parts.length < 4) return null;

  const fileType = parts[2] as MaterialFile['fileType'];
  if (!MATERIAL_FILE_TYPES.includes(fileType)) return null;

  return {
    key,
    fileType,
    baseName: parts.slice(3).join('/'),
    lastModified: object.lastModified,
  };
};

const sortByLastModifiedDesc = (left: ObjectWithType, right: ObjectWithType): number => {
  const leftTime = left.lastModified?.getTime() ?? 0;
  const rightTime = right.lastModified?.getTime() ?? 0;
  return rightTime - leftTime;
};

const toMaterialFile = (params: {
  materialId: string;
  object: ObjectWithType;
  mappedPath?: string;
  mappedName?: string;
  now: string;
}): MaterialFile => {
  const { materialId, object, mappedPath, mappedName, now } = params;
  const id = extractFileId(object.baseName);
  const filename = mappedPath === object.key ? extractFilename(object.baseName, mappedName) : object.baseName;

  return {
    id,
    materialId,
    filename,
    s3Key: object.key,
    contentType: filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
    fileType: object.fileType,
    createdAt: object.lastModified ? DateUtils.format(object.lastModified) : now,
  };
};

export const createListMaterialFiles = async (
  repositories: Repositories,
  materialId: string,
): Promise<MaterialFile[]> => {
  const bucket = ENV.FILES_BUCKET_NAME;
  if (!bucket) return [];

  const prefix = `materials/${materialId}/`;
  const objects = await repositories.s3.listObjectsByPrefix({ bucket, prefix });
  const material = await repositories.materials.get(materialId);
  const typedObjects = objects.map(parseObjectWithType).filter((object): object is ObjectWithType => object !== null);

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

  const now = DateUtils.now();

  return MATERIAL_FILE_TYPES.map((fileType) => {
    const mappedPath = filePathByType[fileType];
    const mappedName = fileNameByType[fileType];
    const candidates = typedObjects.filter((object) => object.fileType === fileType).sort(sortByLastModifiedDesc);
    const object = candidates.find((candidate) => candidate.key === mappedPath) ?? candidates[0];

    if (!object) {
      return null;
    }

    // 旧データでは material テーブル側の path が未設定・不整合でも S3 に実体が残っている。
    // 詳細画面から PDF を開けるよう、現在パスが見つからない場合は種別ごとの最新ファイルへフォールバックする。
    return toMaterialFile({
      materialId,
      object,
      mappedPath,
      mappedName,
      now,
    });
  }).filter((item): item is MaterialFile => item !== null);
};
