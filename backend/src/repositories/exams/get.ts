import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// 指定した試験IDのレコードを取得する
export const get = async (examId: string): Promise<ExamTable | null> => {
  // 主キー examId で対象レコードを取得する
  const result = await dbHelper.get<ExamTable>({
    // 取得対象テーブル
    TableName: TABLE_NAME,
    // 取得対象レコードの主キー
    Key: { examId },
  });
  // 見つからない場合は null を返す
  return result?.Item ?? null;
};
