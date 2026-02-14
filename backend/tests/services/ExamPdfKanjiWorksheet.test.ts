import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { ExamPdfService } from '@/services/exam/examPdfService';
import type { ExamDetail } from '@smart-exam/api-types';

describe('ExamPdfService (KANJI worksheet) smoke', () => {
  it('generates a 1-page PDF for 60 printable items without throwing', async () => {
    const promptText = 'チームのけいせいが不利なまま試合が進む。';
    const review: ExamDetail = {
      id: 't1',
      testId: 't1',
      subject: '1',
      mode: 'KANJI',
      createdDate: '2026-02-14',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/exam/kanji/t1/pdf', downloadUrl: '/api/exam/kanji/t1/pdf?download=1' },
      count: 60,
      questions: Array.from({ length: 60 }, (_v, i) => `w-${i + 1}`),
      results: [],
      items: Array.from({ length: 60 }, (_v, i) => ({
        id: `item-${i + 1}`,
        itemId: `item-${i + 1}`,
        testId: 't1',
        targetType: 'KANJI',
        targetId: `w-${i + 1}`,
        questionText: promptText,
        answerText: '形成',
        readingHiragana: 'けいせい',
        underlineSpec: { type: 'promptSpan', start: 4, length: 4 },
      })),
    };

    const pdf = await ExamPdfService.generatePdfBuffer(review);
    expect(pdf.length).toBeGreaterThan(100);

    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(1);
  });
});
