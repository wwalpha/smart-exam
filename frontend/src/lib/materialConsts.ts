export const MATERIAL_PROVIDER = {
  sapix: 'SAPIX',
  yotsuyaOtsuka: '四谷大塚',
} as const;

export const MATERIAL_PROVIDER_OPTIONS = [MATERIAL_PROVIDER.sapix, MATERIAL_PROVIDER.yotsuyaOtsuka] as const;

export type MaterialProvider = (typeof MATERIAL_PROVIDER_OPTIONS)[number];

export const MATERIAL_NAME_OPTIONS_BY_PROVIDER: Record<MaterialProvider, readonly string[]> = {
  [MATERIAL_PROVIDER.sapix]: ['マンスリーテスト', '組分テスト', '復習テスト', '実力診断テスト', 'デイリーサポート'] as const,
  [MATERIAL_PROVIDER.yotsuyaOtsuka]: ['組分テスト', '週テスト'] as const,
};

export type MaterialPdfFileType = 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER';

export const MATERIAL_PDF_FILE_TYPES: MaterialPdfFileType[] = ['QUESTION', 'ANSWER', 'GRADED_ANSWER'];

export const MATERIAL_PDF_FILE_TYPE_LABEL: Record<MaterialPdfFileType, string> = {
  QUESTION: '問題用紙',
  ANSWER: '解答・解説',
  GRADED_ANSWER: '採点後',
};

export type MaterialStatus = 'COMPLETED' | 'IN_PROGRESS';

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  COMPLETED: '完了',
  IN_PROGRESS: '進行中',
};
