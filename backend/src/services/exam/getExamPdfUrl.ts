import { ApiError } from '@/lib/apiError';
import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';
import { ExamPdfService } from './examPdfService';

// 内部で利用する補助処理を定義する
const getExamPdfUrlImpl = async (
  deps: {
    repositories: Repositories;
    getExam: ExamsService['getExam'];
  },
  examId: string,
  params?: { download?: boolean },
): Promise<{ url: string } | null> => {
  // 非同期で必要な値を取得する
  const testRow = await deps.repositories.exams.get(examId);
  // 条件に応じて処理を分岐する
  if (!testRow) return null;

  // 処理で使う値を準備する
  const responseContentDisposition = params?.download ? 'attachment' : 'inline';

  // 条件に応じて処理を分岐する
  if (!ENV.FILES_BUCKET_NAME) {
    throw new ApiError(
      'FILES_BUCKET_NAME is not configured',
      500,
      ['internal_server_error'],
      ['files_bucket_not_configured'],
    );
  }

  // まずテーブルの pdfS3Key を使って presign（KANJI は作成時に生成済み）
  if (testRow.mode === 'KANJI' && testRow.pdfS3Key) {
    // 非同期で必要な値を取得する
    const url = await deps.repositories.s3.getPresignedGetUrl({
      bucket: ENV.FILES_BUCKET_NAME,
      key: testRow.pdfS3Key,
      responseContentDisposition,
      expiresInSeconds: 3600,
    });
    // 処理結果を呼び出し元へ返す
    return { url };
  }

  // QUESTION 等は生成（後方互換: pdfS3Key が無いKANJIもここで生成して復旧）
  const review = await deps.getExam(examId);
  // 条件に応じて処理を分岐する
  if (!review) return null;

  // 非同期で必要な値を取得する
  const pdfBuffer = await ExamPdfService.generatePdfBuffer(review, { includeGenerated: false });
  // 処理で使う値を準備する
  const key = testRow.pdfS3Key ?? `exams/${examId}.pdf`;

  // 非同期処理の完了を待つ
  await deps.repositories.s3.putObject({
    bucket: ENV.FILES_BUCKET_NAME,
    key,
    body: pdfBuffer,
    contentType: 'application/pdf',
  });

  // 条件に応じて処理を分岐する
  if (testRow.pdfS3Key !== key) {
    // 非同期処理の完了を待つ
    await deps.repositories.exams.updatePdfS3Key(examId, key);
  }

  // 非同期で必要な値を取得する
  const url = await deps.repositories.s3.getPresignedGetUrl({
    bucket: ENV.FILES_BUCKET_NAME,
    key,
    responseContentDisposition,
    expiresInSeconds: 3600,
  });

  // 処理結果を呼び出し元へ返す
  return { url };
};

// 公開するサービス処理を定義する
export const createGetExamPdfUrl = (deps: {
  repositories: Repositories;
  getExam: ExamsService['getExam'];
}): ExamsService['getExamPdfUrl'] => {
  // 処理結果を呼び出し元へ返す
  return getExamPdfUrlImpl.bind(null, deps);
};
