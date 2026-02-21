import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionTable } from '@/types/db';

// 問題テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_MATERIAL_DETAILS;

// questionId をキーに単一の問題レコードを取得する
export const get = async (questionId: string): Promise<MaterialQuestionTable | null> => {
  // DynamoDBから対象レコードを取得する
  const result = await dbHelper.get<MaterialQuestionTable>({
    // 取得対象テーブル
    TableName: TABLE_NAME,
    // 取得対象レコードの主キー
    Key: { questionId },
  });
  // レコードが存在しない場合は null を返す
  return result?.Item || null;
};
