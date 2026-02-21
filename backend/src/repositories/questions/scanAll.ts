import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialDetailsTable } from '@/types/db';

// 問題テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_MATERIAL_DETAILS;

// 問題テーブルの全レコードを取得する
export const scanAll = async (): Promise<MaterialDetailsTable[]> => {
  // テーブル全体をスキャンする
  const result = await dbHelper.scan<MaterialDetailsTable>({
    // スキャン対象テーブル
    TableName: TABLE_NAME,
  });
  // 結果が空なら空配列を返す
  return result.Items || [];
};
