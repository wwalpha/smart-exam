import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// exams テーブルのレコードを全件取得する
export const scanAll = async (): Promise<ExamTable[]> => {
  // テーブル全体をスキャンする
  const result = await dbHelper.scan<ExamTable>({
    // スキャン対象テーブル
    TableName: TABLE_NAME,
  });
  // 結果が空の場合は空配列を返す
  return result.Items ?? [];
};
