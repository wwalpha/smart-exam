import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// 指定したテストIDのレコードを削除する
export const remove = async (testId: string): Promise<void> => {
  // 主キー testId を指定してDynamoDBから削除する
  await dbHelper.delete({
    // 削除対象テーブル
    TableName: TABLE_NAME,
    // 削除対象レコードの主キー
    Key: { testId },
  });
};
