import { ReviewTestRepository } from '@/repositories';
import { ReviewTestPdfService } from '@/services/ReviewTestPdfService';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

type GetReviewTestPdfParams = {
  testId: string;
};

export const getReviewTestPdf: AsyncHandler<GetReviewTestPdfParams, Buffer | { error: string }, {}, ParsedQs> = async (
  req,
  res
) => {
  const { testId } = req.params;
  const review = await ReviewTestRepository.getReviewTest(testId);
  if (!review) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(review);

  const wantDownload =
    req.query.download === '1' || req.query.download === 'true' || req.query.disposition === 'attachment';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${wantDownload ? 'attachment' : 'inline'}; filename="review-test-${testId}.pdf"`
  );
  res.status(200).send(pdfBuffer);
};
