import { ReviewTestRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { s3Client } from '@/lib/aws';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from '@/lib/env';
import { ReviewTestsService } from '@/services';
import { ReviewTestPdfService } from '@/services/ReviewTestPdfService';
import { ApiError } from '@/lib/apiError';

type GetReviewTestPdfParams = {
  testId: string;
};

export const getReviewTestPdf: AsyncHandler<
  GetReviewTestPdfParams,
  { url: string } | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { testId } = req.params;

  // まずテーブルの pdfS3Key を使って presign（KANJI は作成時に生成済み）
  const testRow = await ReviewTestsService.get(testId);
  if (!testRow) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  if (testRow.mode === 'KANJI' && testRow.pdfS3Key) {
    if (!ENV.FILES_BUCKET_NAME) {
      throw new ApiError(
        'FILES_BUCKET_NAME is not configured',
        500,
        ['internal_server_error'],
        ['files_bucket_not_configured']
      );
    }

    const command = new GetObjectCommand({
      Bucket: ENV.FILES_BUCKET_NAME,
      Key: testRow.pdfS3Key,
      ResponseContentDisposition: 'inline',
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ url });
    return;
  }

  // QUESTION 等は従来通り生成（後方互換: pdfS3Key が無いKANJIもここで生成して復旧）
  const review = await ReviewTestRepository.getReviewTest(testId);
  if (!review) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(review);
  const key = testRow.pdfS3Key ?? `review-tests/${testId}.pdf`;

  if (!ENV.FILES_BUCKET_NAME) {
    throw new ApiError(
      'FILES_BUCKET_NAME is not configured',
      500,
      ['internal_server_error'],
      ['files_bucket_not_configured']
    );
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: ENV.FILES_BUCKET_NAME,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    })
  );

  const command = new GetObjectCommand({
    Bucket: ENV.FILES_BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: 'inline',
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  res.json({ url });
};
