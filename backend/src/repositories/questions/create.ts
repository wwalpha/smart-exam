import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialDetailsTable } from '@/types/db';

// 問題テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_MATERIAL_DETAILS;

// 問題レコードを新規作成または上書き保存する
export const create = async (item: MaterialDetailsTable): Promise<void> => {
  // DynamoDBへ問題レコードを書き込む
  await dbHelper.put({
    // 書き込み対象テーブル
    TableName: TABLE_NAME,
    // 保存する問題レコード本体
    Item: item,
  });
};
