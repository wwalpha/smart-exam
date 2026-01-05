import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

import { ENV } from '@/lib/env';
import { logger } from '@/lib/logger';
import type { ReviewTestDetail } from '@smart-exam/api-types';

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const buildHtml = (review: ReviewTestDetail): string => {
  const title = `復習テスト (${review.subject})`;
  const createdAt = escapeHtml(review.createdAt);

  const itemsHtml = review.items
    .map((item, idx) => {
      const questionText =
        item.questionText ?? item.displayLabel ?? item.canonicalKey ?? item.kanji ?? item.targetId ?? '';

      return `
<div class="item">
  <div class="q">
    <span class="no">${idx + 1}.</span>
    <span class="text">${escapeHtml(questionText)}</span>
  </div>
  <div class="lines">
    <div class="line"></div>
    <div class="line"></div>
  </div>
</div>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", sans-serif; color: #000; }
    .header { display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10mm; }
    .title { font-size: 18px; font-weight: 700; }
    .meta { font-size: 12px; }
    .items { display:flex; flex-direction: column; gap: 8mm; }
    .item { break-inside: avoid; }
    .q { display:flex; gap: 6px; font-size: 14px; }
    .no { width: 26px; text-align: right; flex: 0 0 auto; }
    .text { flex: 1 1 auto; white-space: pre-wrap; word-break: break-word; }
    .lines { margin-left: 32px; margin-top: 4mm; display:flex; flex-direction: column; gap: 4mm; }
    /* 要望: 解答欄を2倍長く -> 用紙幅いっぱいに引く */
    .line { width: 100%; border-bottom: 1px solid #000; height: 10mm; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${escapeHtml(title)}</div>
    <div class="meta">作成日時: ${createdAt}</div>
  </div>

  <div class="items">
    ${itemsHtml}
  </div>
</body>
</html>`;
};

export const ReviewTestPdfService = {
  generatePdfBuffer: async (review: ReviewTestDetail): Promise<Buffer> => {
    const html = buildHtml(review);

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });

      return Buffer.from(pdf);
    } catch (e) {
      logger.error('Failed to generate review test PDF', {
        err: e,
        testId: review.testId,
        bucket: ENV.FILES_BUCKET_NAME,
      });
      throw e;
    } finally {
      await browser.close();
    }
  },
};
