import { ApiError } from '@/lib/apiError';
import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';
import { ExamPdfService } from './examPdfService';

// 試験PDFの配布URLを返す。未生成の場合はその場で生成して保存する。
export const createGetExamPdfUrl = (deps: {
  repositories: Repositories;
  getExam: ExamsService['getExam'];
}): ExamsService['getExamPdfUrl'] => {
  return async (examId: string, params?: { download?: boolean }): Promise<{ url: string } | null> => {
    const testRow = await deps.repositories.exams.get(examId);
    if (!testRow) return null;
    const responseContentDisposition = params?.download ? 'attachment' : 'inline';
    if (!ENV.FILES_BUCKET_NAME) {
      throw new ApiError(
        'FILES_BUCKET_NAME is not configured',
        500,
        ['internal_server_error'],
        ['files_bucket_not_configured'],
      );
    }

    // KANJI は作成時に PDF を持つ想定なので、保存済みキーから即時に署名URLを返す。
    if (testRow.mode === 'KANJI' && testRow.pdfS3Key) {
      const url = await deps.repositories.s3.getPresignedGetUrl({
        bucket: ENV.FILES_BUCKET_NAME,
        key: testRow.pdfS3Key,
        responseContentDisposition,
        expiresInSeconds: 3600,
      });
      return { url };
    }

    // MATERIAL と後方互換ケースはここで PDF を生成して S3 に永続化する。
    const review = await deps.getExam(examId);
    if (!review) return null;
    const pdfBuffer = await ExamPdfService.generatePdfBuffer(review, { includeGenerated: false });
    const key = testRow.pdfS3Key ?? `exams/${examId}.pdf`;
    await deps.repositories.s3.putObject({
      bucket: ENV.FILES_BUCKET_NAME,
      key,
      body: pdfBuffer,
      contentType: 'application/pdf',
    });

    // まだキー未設定のレコードは、次回以降の再生成を避けるため保存しておく。
    if (testRow.pdfS3Key !== key) {
      await deps.repositories.exams.updatePdfS3Key(examId, key);
    }
    const url = await deps.repositories.s3.getPresignedGetUrl({
      bucket: ENV.FILES_BUCKET_NAME,
      key,
      responseContentDisposition,
      expiresInSeconds: 3600,
    });
    return { url };
  };
};
