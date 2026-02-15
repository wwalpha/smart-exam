import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionTable } from '@/types/db';

// 問題テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

// materialId に紐づく問題レコード一覧を取得する
export const listByMaterialId = async (materialId: string): Promise<MaterialQuestionTable[]> => {
  // GSIを使って教材IDで問題一覧を検索する
  const result = await dbHelper.query<MaterialQuestionTable>({
    // 検索対象テーブル
    TableName: TABLE_NAME,
    // materialId 検索用インデックス
    IndexName: 'gsi_material_id_number',
    // materialId が一致するレコードに絞る
    KeyConditionExpression: '#materialId = :materialId',
    // キー条件式で使う属性名プレースホルダ
    ExpressionAttributeNames: { '#materialId': 'materialId' },
    // キー条件式で使う属性値プレースホルダ
    ExpressionAttributeValues: { ':materialId': materialId },
  });
  // 結果が空なら空配列を返す
  return result.Items || [];
};
