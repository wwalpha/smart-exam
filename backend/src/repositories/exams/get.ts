import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// 指定したテストIDのレコードを取得する
export const get = async (testId: string): Promise<ExamTable | null> => {
  // 主キー testId で対象レコードを取得する
  const result = await dbHelper.get<ExamTable>({
    TableName: TABLE_NAME,
    Key: { testId },
  });
  // 見つからない場合は null を返す
  return result?.Item ?? null;
};
