import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionsTable } from '@/types/db';

// 問題テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

// questionId をキーに問題レコードを部分更新する
export const update = async (
  questionId: string,
  updates: Partial<MaterialQuestionsTable>,
): Promise<MaterialQuestionsTable | null> => {
  // 更新式で使う属性名プレースホルダを保持する
  const expAttrNames: Record<string, string> = {};
  // 更新式で使う属性値プレースホルダを保持する
  const expAttrValues: Record<string, unknown> = {};
  // DynamoDB UpdateExpression の初期値
  let updateExp = 'SET';

  // 更新対象の各キー・値から更新式を動的に組み立てる
  Object.entries(updates).forEach(([key, value], index) => {
    // 属性名プレースホルダ（例: #attr0）
    const attrName = `#attr${index}`;
    // 属性値プレースホルダ（例: :val0）
    const attrValue = `:val${index}`;
    // プレースホルダと実属性名を対応付ける
    expAttrNames[attrName] = key;
    // プレースホルダと実値を対応付ける
    expAttrValues[attrValue] = value;
    // UpdateExpression に1項目分追加する
    updateExp += ` ${attrName} = ${attrValue},`;
  });

  // 末尾カンマを削除して正しい式に整形する
  updateExp = updateExp.slice(0, -1);

  // 対象レコードを更新して更新後の値を取得する
  const result = await dbHelper.update({
    // 更新対象テーブル
    TableName: TABLE_NAME,
    // 更新対象レコードの主キー
    Key: { questionId },
    // 動的に組み立てた更新式
    UpdateExpression: updateExp,
    // 更新式で使う属性名プレースホルダ
    ExpressionAttributeNames: expAttrNames,
    // 更新式で使う属性値プレースホルダ
    ExpressionAttributeValues: expAttrValues,
    // 更新後レコードを返却させる
    ReturnValues: 'ALL_NEW',
  });

  // 更新後レコードを返し、取得できなければ null を返す
  return (result.Attributes as MaterialQuestionsTable) || null;
};
