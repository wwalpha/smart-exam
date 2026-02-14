import type { Material } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import type { MaterialTable } from '@/types/db';

// 内部で利用する補助処理を定義する
const requireYmd = (value: unknown, fieldName: string): string => {
  // 処理で使う値を準備する
  const trimmed = String(value ?? '').trim();
  // 条件に応じて処理を分岐する
  if (!DateUtils.isValidYmd(trimmed)) {
    throw new Error(`${fieldName} is required (YYYY-MM-DD)`);
  }
  // 処理結果を呼び出し元へ返す
  return trimmed;
};

// 内部で利用する補助処理を定義する
const requireNonEmpty = (value: unknown, fieldName: string): string => {
  // 処理で使う値を準備する
  const trimmed = String(value ?? '').trim();
  // 条件に応じて処理を分岐する
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  // 処理結果を呼び出し元へ返す
  return trimmed;
};

// 公開するサービス処理を定義する
export const toApiMaterial = (dbItem: MaterialTable): Material => {
  // 処理結果を呼び出し元へ返す
  return {
    id: dbItem.materialId,
    name: dbItem.title,
    subject: dbItem.subjectId,
    grade: requireNonEmpty(dbItem.grade, 'Material.grade'),
    provider: requireNonEmpty(dbItem.provider, 'Material.provider'),
    materialDate: requireYmd(dbItem.materialDate, 'Material.materialDate'),
    registeredDate: requireYmd(dbItem.registeredDate ?? dbItem.materialDate, 'Material.registeredDate'),
  };
};
