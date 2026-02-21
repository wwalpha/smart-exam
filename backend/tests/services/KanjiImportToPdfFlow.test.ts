import { describe, expect, it, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { createKanjiService } from '@/services/kanji';
import { ExamPdfService } from '@/services/exam/examPdfService';
import type { Repositories } from '@/repositories/createRepositories';
import type { ExamDetail } from '@smart-exam/api-types';

describe('Kanji QUESTIONS import -> generate -> verify -> PDF (integration-ish)', () => {
  it('imports verified kanji question and generates worksheet PDF', async () => {
    type KanjiItem = {
      wordId: string;
      subject: string;
      question: string;
      answer: string;
      readingHiragana?: string;
      underlineSpec?: { type: 'promptSpan'; start: number; length: number };
    };

    const kanjis = new Map<string, KanjiItem>();
    const candidateParams: Array<{ subject: string; questionId: string; status: string }> = [];

    const repositories = {
      kanji: {
        listKanji: vi.fn().mockImplementation(async (subject?: string) => {
          const items = Array.from(kanjis.values());
          return subject ? items.filter((x) => x.subject === subject) : items;
        }),
        bulkCreate: vi.fn().mockImplementation(async (items: KanjiItem[]) => {
          for (const item of items) {
            kanjis.set(item.wordId, item);
          }
        }),
        create: vi.fn().mockImplementation(async (item: KanjiItem) => {
          kanjis.set(item.wordId, item);
        }),
        get: vi.fn().mockImplementation(async (id: string) => {
          return kanjis.get(id) ?? null;
        }),
      },
      examCandidates: {
        deleteCandidatesByTargetId: vi
          .fn()
          .mockImplementation(async (params: { subject: string; targetId: string }) => {
            for (let i = candidateParams.length - 1; i >= 0; i -= 1) {
              const c = candidateParams[i];
              if (c.subject === params.subject && c.questionId === params.targetId) {
                candidateParams.splice(i, 1);
              }
            }
          }),
        bulkCreateCandidates: vi
          .fn()
          .mockImplementation(async (items: Array<{ subject: string; questionId: string; status: string }>) => {
            for (const item of items) {
              candidateParams.push({ subject: item.subject, questionId: item.questionId, status: item.status });
            }
          }),
        getLatestOpenCandidateByTargetId: vi
          .fn()
          .mockImplementation(async (params: { subject: string; targetId: string }) => {
            for (let i = candidateParams.length - 1; i >= 0; i -= 1) {
              const c = candidateParams[i];
              if (c.subject === params.subject && c.questionId === params.targetId && c.status === 'OPEN') {
                return { status: 'OPEN' } as unknown;
              }
            }
            return null;
          }),
        createCandidate: vi
          .fn()
          .mockImplementation(async (params: { subject: string; questionId: string; status: string }) => {
            candidateParams.push(params);
            return params as unknown;
          }),
      },
      examHistories: {
        putHistory: vi.fn().mockResolvedValue(undefined),
      },
      bedrock: {
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'けいせい',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const kanjiService = createKanjiService(repositories);

    const imported = await kanjiService.importKanji({
      subject: '1',
      fileContent: '彼はけいせいを説明した。|形成|2026-02-01,OK|2026-02-05,NG\n',
    });

    expect(imported.successCount).toBe(1);
    const id = imported.questionIds?.[0];
    expect(id).toBeTruthy();

    // import時点で印刷に必要なフィールドが保存される
    const w = kanjis.get(String(id));
    expect(w?.readingHiragana).toBe('けいせい');
    expect(w?.underlineSpec).toEqual({ type: 'promptSpan', start: 2, length: 4 });

    // import時点で候補が作成される
    expect(candidateParams.some((c) => c.status === 'OPEN')).toBe(true);

    const questionText = String(w?.question ?? '');

    const review: ExamDetail = {
      examId: 't1',
      subject: '1',
      mode: 'KANJI',
      createdDate: '2026-02-14',
      status: 'IN_PROGRESS',
      pdf: { url: '/api/exam/kanji/t1/pdf', downloadUrl: '/api/exam/kanji/t1/pdf?download=1' },
      count: 60,
      results: [],
      items: Array.from({ length: 60 }, (_v, i) => ({
        id: `item-${i + 1}`,
        itemId: `item-${i + 1}`,
        examId: 't1',
        targetType: 'KANJI',
        targetId: String(id),
        questionText,
        answerText: w?.answer,
        readingHiragana: w?.readingHiragana,
        underlineSpec: w?.underlineSpec,
      })),
    };

    const pdf = await ExamPdfService.generatePdfBuffer(review);
    expect(pdf.length).toBeGreaterThan(100);

    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(1);
  });
});
