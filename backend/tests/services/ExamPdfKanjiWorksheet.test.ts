import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { ExamPdfService } from '@/services/exam/examPdfService';
import type { ExamDetail } from '@smart-exam/api-types';

describe('ExamPdfService (KANJI worksheet) smoke', () => {
  it('generates a 2-page PDF for 60 printable items without throwing', async () => {
    const promptText = 'チームのけいせいが不利なまま試合が進む。';
    const review: ExamDetail = {
      examId: 't1',
      subject: '1',
      mode: 'KANJI',
      createdDate: '2026-02-14',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/exam/t1/pdf', downloadUrl: '/api/exam/t1/pdf?download=1' },
      count: 60,
      results: [],
      items: Array.from({ length: 60 }, (_v, i) => ({
        id: `item-${i + 1}`,
        itemId: `item-${i + 1}`,
        examId: 't1',
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
    expect(doc.getPageCount()).toBe(2);
  });

  it('generates PDF when prompt text uses katakana and reading is hiragana', async () => {
    const promptText = 'イシャにのどをみてもらう。';
    const review: ExamDetail = {
      examId: 't2',
      subject: '1',
      mode: 'KANJI',
      createdDate: '2026-02-14',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/exam/t2/pdf', downloadUrl: '/api/exam/t2/pdf?download=1' },
      count: 1,
      results: [],
      items: [
        {
          id: 'item-1',
          itemId: 'item-1',
          examId: 't2',
          targetType: 'KANJI',
          targetId: 'w-1',
          questionText: promptText,
          answerText: '医者',
          readingHiragana: 'いしゃ',
          underlineSpec: { type: 'promptSpan', start: 0, length: 3 },
        },
      ],
    };

    const pdf = await ExamPdfService.generatePdfBuffer(review);
    expect(pdf.length).toBeGreaterThan(100);

    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(1);
  });
});
