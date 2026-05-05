import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { ExamPdfService } from '@/services/exam/examPdfService';
import type { ExamDetail } from '@smart-exam/api-types';

describe('ExamPdfService (MATERIAL worksheet) pagination', () => {
  it('renders multiple material sections continuously on the same page when they fit', async () => {
    const review: ExamDetail = {
      examId: 'm1',
      subject: '4',
      mode: 'MATERIAL',
      createdDate: '2026-05-05',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/exam/m1/pdf', downloadUrl: '/api/exam/m1/pdf?download=1' },
      count: 4,
      results: [],
      items: [
        {
          id: 'item-1',
          itemId: 'item-1',
          examId: 'm1',
          targetType: 'MATERIAL',
          targetId: 'q-1',
          materialId: 'mat-a',
          provider: 'SAPIX',
          materialName: '5月組み分けテスト',
          materialDate: '2026-05-01',
          canonicalKey: '1-1',
          questionText: '1-1',
        },
        {
          id: 'item-2',
          itemId: 'item-2',
          examId: 'm1',
          targetType: 'MATERIAL',
          targetId: 'q-2',
          materialId: 'mat-a',
          provider: 'SAPIX',
          materialName: '5月組み分けテスト',
          materialDate: '2026-05-01',
          canonicalKey: '1-2',
          questionText: '1-2',
        },
        {
          id: 'item-3',
          itemId: 'item-3',
          examId: 'm1',
          targetType: 'MATERIAL',
          targetId: 'q-3',
          materialId: 'mat-b',
          provider: 'SAPIX',
          materialName: '6月組み分けテスト',
          materialDate: '2026-06-01',
          canonicalKey: '1-1',
          questionText: '1-1',
        },
        {
          id: 'item-4',
          itemId: 'item-4',
          examId: 'm1',
          targetType: 'MATERIAL',
          targetId: 'q-4',
          materialId: 'mat-b',
          provider: 'SAPIX',
          materialName: '6月組み分けテスト',
          materialDate: '2026-06-01',
          canonicalKey: '1-2',
          questionText: '1-2',
        },
      ],
    };

    const pdf = await ExamPdfService.generatePdfBuffer(review);
    expect(pdf.length).toBeGreaterThan(100);

    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(1);
  });
});