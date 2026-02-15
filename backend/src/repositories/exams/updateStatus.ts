import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// 指定した試験のステータスを更新する
export const updateStatus = async (examId: string, status: ExamTable['status']): Promise<ExamTable | null> => {
  // 主キー examId を条件に status 属性を書き換える
  const result = await dbHelper.update({
    // 更新対象テーブル
    TableName: TABLE_NAME,
    // 更新対象レコードの主キー
    Key: { examId },
    // status 属性を新しい値へ更新する
    UpdateExpression: 'SET #status = :status',
    // 更新式で使う属性名のプレースホルダ
    ExpressionAttributeNames: { '#status': 'status' },
    // 更新式で使う属性値のプレースホルダ
    ExpressionAttributeValues: { ':status': status },
    // 更新後のレコードを返却させる
    ReturnValues: 'ALL_NEW',
  });

  // 更新後の属性を返し、取得できなければ null を返す
  return (result.Attributes as ExamTable) || null;
};
