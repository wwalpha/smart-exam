// Module: getExamPdfController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';

import type { Services } from '@/services/createServices';

/** Creates get review test PDF controller. */
export const getExamPdfController = (services: Services) => {
  const getExamPdf: AsyncHandler<
    { testId: string },
    { url: string } | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { testId } = req.params;

    const direct = String(req.query.direct ?? '') === '1' || String(req.query.direct ?? '') === 'true';
    const download = String(req.query.download ?? '') === '1' || String(req.query.download ?? '') === 'true';
    const includeGenerated =
      String(req.query.includeGenerated ?? '') === '1' || String(req.query.includeGenerated ?? '') === 'true';

    // ローカル検証用: S3 / presign を経由せずにPDFを直接返す
    if (direct) {
      const pdf = await services.exams.generateExamPdfBuffer(testId, { includeGenerated });
      if (!pdf) {
        res.status(404).json({ error: 'Not Found' });
        return;
      }

      const filename = `review-test-${testId}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);
      // NOTE: res is typed for JSON responses; end() avoids the Response body generic mismatch.
      res.status(200).end(pdf);
      return;
    }

    const result = await services.exams.getExamPdfUrl(testId, { download });
    if (!result) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(result);
  };

  return { getExamPdf };
};
