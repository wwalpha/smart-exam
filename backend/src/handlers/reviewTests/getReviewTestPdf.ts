import { ReviewTestRepository } from '@/repositories';
import { ReviewTestPdfService } from '@/services/ReviewTestPdfService';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { s3Client } from '@/lib/aws';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from '@/lib/env';

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
  const review = await ReviewTestRepository.getReviewTest(testId);
  if (!review) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  // Generate PDF and upload to S3 if needed
  // For now, always regenerate to ensure latest state (or if file is missing)
  const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(review);
  const key = `review-tests/${testId}.pdf`;

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
