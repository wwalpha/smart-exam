import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// 試験レコードを保存または上書きする
export const put = async (item: ExamTable): Promise<void> => {
  // 指定テーブルへレコードを書き込む
  await dbHelper.put({
    // 書き込み先テーブル
    TableName: TABLE_NAME,
    // 保存する試験レコード本体
    Item: item,
  });
};
