import type { Material } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import type { MaterialTable } from '@/types/db';

// 内部で利用する補助処理を定義する
const optionalYmd = (value: unknown): string => {
  // 処理で使う値を準備する
  const trimmed = String(value ?? '').trim();
  // 条件に応じて処理を分岐する
  if (!DateUtils.isValidYmd(trimmed)) {
    return '';
  }
  // 処理結果を呼び出し元へ返す
  return trimmed;
};

// 内部で利用する補助処理を定義する
const optionalNonEmpty = (value: unknown): string => {
  // 処理結果を呼び出し元へ返す
  return String(value ?? '').trim();
};

// 公開するサービス処理を定義する
export const toApiMaterial = (dbItem: MaterialTable): Material => {
  const grade = optionalNonEmpty(dbItem.grade);
  const provider = optionalNonEmpty(dbItem.provider);
  const materialDate = optionalYmd(dbItem.materialDate);
  const registeredDate = optionalYmd(dbItem.registeredDate ?? dbItem.materialDate);

  // 旧データ互換のため、検索・一覧で欠損値があってもレスポンス生成を継続する
  // 処理結果を呼び出し元へ返す
  return {
    id: dbItem.materialId,
    name: dbItem.title,
    subject: dbItem.subjectId,
    grade,
    provider,
    materialDate,
    registeredDate,
    isCompleted: dbItem.isCompleted ?? false,
  };
};
