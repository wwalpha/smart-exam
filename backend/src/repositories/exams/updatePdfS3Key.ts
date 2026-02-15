import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { ExamTable } from '@/types/db';

// exams テーブル名を環境変数から取得する
const TABLE_NAME = ENV.TABLE_EXAMS;

// 指定したテストのPDF保存キーを更新する
export const updatePdfS3Key = async (testId: string, pdfS3Key: string): Promise<ExamTable | null> => {
  // 主キー testId を条件に pdfS3Key 属性を書き換える
  const result = await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { testId },
    UpdateExpression: 'SET #pdfS3Key = :pdfS3Key',
    ExpressionAttributeNames: { '#pdfS3Key': 'pdfS3Key' },
    ExpressionAttributeValues: { ':pdfS3Key': pdfS3Key },
    ReturnValues: 'ALL_NEW',
  });

  // 更新後の属性を返し、取得できなければ null を返す
  return (result.Attributes as ExamTable) || null;
};
