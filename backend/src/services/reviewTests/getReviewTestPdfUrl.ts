import { ApiError } from '@/lib/apiError';
import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { ReviewTestsService } from './createReviewTestsService';
import { ReviewTestPdfService } from './reviewTestPdfService';

export const createGetReviewTestPdfUrl = (deps: {
  repositories: Repositories;
  getReviewTest: ReviewTestsService['getReviewTest'];
}): ReviewTestsService['getReviewTestPdfUrl'] => {
  return async (testId, params): Promise<{ url: string } | null> => {
    const testRow = await deps.repositories.reviewTests.get(testId);
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

    // まずテーブルの pdfS3Key を使って presign（KANJI は作成時に生成済み）
    if (testRow.mode === 'KANJI' && testRow.pdfS3Key) {
      const url = await deps.repositories.s3.getPresignedGetUrl({
        bucket: ENV.FILES_BUCKET_NAME,
        key: testRow.pdfS3Key,
        responseContentDisposition,
        expiresInSeconds: 3600,
      });
      return { url };
    }

    // QUESTION 等は生成（後方互換: pdfS3Key が無いKANJIもここで生成して復旧）
    const review = await deps.getReviewTest(testId);
    if (!review) return null;

    const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(review, { includeGenerated: false });
    const key = testRow.pdfS3Key ?? `review-tests/${testId}.pdf`;

    await deps.repositories.s3.putObject({
      bucket: ENV.FILES_BUCKET_NAME,
      key,
      body: pdfBuffer,
      contentType: 'application/pdf',
    });

    const url = await deps.repositories.s3.getPresignedGetUrl({
      bucket: ENV.FILES_BUCKET_NAME,
      key,
      responseContentDisposition,
      expiresInSeconds: 3600,
    });

    return { url };
  };
};
