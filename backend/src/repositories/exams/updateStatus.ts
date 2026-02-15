import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// 指定したテストのステータスを更新する
export const updateStatus = async (testId: string, status: ExamTable['status']): Promise<ExamTable | null> => {
  // 主キー testId を条件に status 属性を書き換える
  const result = await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { testId },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':status': status },
    ReturnValues: 'ALL_NEW',
  });

  // 更新後の属性を返し、取得できなければ null を返す
  return (result.Attributes as ExamTable) || null;
};
