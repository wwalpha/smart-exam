// Module: getExamPdfController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedParams, ValidatedQuery } from '@/types/express';
import type { ParsedQs } from 'qs';

import type { Services } from '@/services/createServices';

import { GetExamPdfParamsSchema, GetExamPdfQuerySchema } from './getExamPdfController.schema';

/** Creates get review test PDF controller. */
export const getExamPdfController = (services: Services) => {
  const getExamPdf: AsyncHandler<
    { testId: string },
    { url: string } | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    // パスパラメータから対象テストIDを取得する
    const { testId } = (req.validated?.params ?? req.params) as ValidatedParams<typeof GetExamPdfParamsSchema>;
    // クエリ文字列のオプション値を取得する
    const query = (req.validated?.query ?? req.query) as ValidatedQuery<typeof GetExamPdfQuerySchema>;

    // PDFを直接返すかどうかのフラグ
    const direct = query.direct === true;
    // 強制ダウンロードとして返すかどうかのフラグ
    const download = query.download === true;
    // 生成済み問題を含めるかどうかのフラグ
    const includeGenerated = query.includeGenerated === true;

    // ローカル検証用: S3 / presign を経由せずにPDFを直接返す
    if (direct) {
      // PDFバイナリを生成する
      const pdf = await services.exams.generateExamPdfBuffer(testId, { includeGenerated });
      // 対象が存在しない場合は404を返す
      if (!pdf) {
        res.status(404).json({ error: 'Not Found' });
        return;
      }

      // レスポンスヘッダーに設定するファイル名を組み立てる
      const filename = `review-test-${testId}.pdf`;
      // PDFとして返すためのコンテンツタイプを設定する
      res.setHeader('Content-Type', 'application/pdf');
      // inline/attachment を切り替えてコンテンツディスポジションを設定する
      res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);
      // NOTE: res is typed for JSON responses; end() avoids the Response body generic mismatch.
      // 生成したPDFバッファをそのまま返す
      res.status(200).end(pdf);
      return;
    }

    // 署名付きURLを発行してPDF取得先を返す
    const result = await services.exams.getExamPdfUrl(testId, { download });
    // 対象が存在しない場合は404を返す
    if (!result) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    // 署名付きURLをJSONで返す
    res.json(result);
  };

  // ルート登録で使うスキーマとハンドラを返す
  return { GetExamPdfParamsSchema, GetExamPdfQuerySchema, getExamPdf };
};
