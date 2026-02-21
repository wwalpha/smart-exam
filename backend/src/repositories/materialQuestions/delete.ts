import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

// 問題テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

// questionId をキーに問題レコードを削除する
export const remove = async (questionId: string): Promise<void> => {
  // DynamoDBから対象レコードを削除する
  await dbHelper.delete({
    // 削除対象テーブル
    TableName: TABLE_NAME,
    // 削除対象レコードの主キー
    Key: { questionId },
  });
};
