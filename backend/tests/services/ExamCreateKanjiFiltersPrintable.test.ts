import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

// NOTE: This test verifies that KANJI review test creation only uses printable items
// (i.e., required kanji-question fields exist), so PDF generation won't fail with no_printable_items.
describe('ExamsService.createExam (KANJI)', () => {
  it('filters out non-printable candidates before selecting', async () => {
    process.env.FILES_BUCKET_NAME = 'dummy-bucket';
    vi.resetModules();
    const { createExamsService } = await import('@/services/exam');

    const repositories = {
      examCandidates: {
        listDueCandidates: vi.fn().mockResolvedValue([
          {
            subject: '1',
            candidateKey: '2026-02-14#c1',
            id: 'c1',
            questionId: 'w-draft',
            mode: 'KANJI',
            status: 'OPEN',
            correctCount: 0,
            nextTime: '2026-02-14',
            createdAt: '2026-02-14T00:00:00.000Z',
          },
          {
            subject: '1',
            candidateKey: '2026-02-14#c2',
            id: 'c2',
            questionId: 'w-verified',
            mode: 'KANJI',
            status: 'OPEN',
            correctCount: 0,
            nextTime: '2026-02-14',
            createdAt: '2026-02-14T00:00:01.000Z',
          },
        ]),
        lockCandidateIfUnlocked: vi.fn().mockResolvedValue(undefined),
        getLatestCandidateByTargetId: vi.fn().mockResolvedValue(null),
        releaseLockIfMatch: vi.fn().mockResolvedValue(undefined),
        listLockedCandidatesByExamId: vi.fn().mockResolvedValue([]),
      },
      exams: {
        put: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockImplementation(async (testId: string) => {
          // minimal ExamTable for getExam()
          return {
            testId,
            subject: '1',
            mode: 'KANJI',
            status: 'IN_PROGRESS',
            count: 1,
            questions: ['w-verified'],
            createdDate: '2026-02-14',
            pdfS3Key: `exams/${testId}.pdf`,
            results: [],
          } as unknown;
        }),
        delete: vi.fn().mockResolvedValue(undefined),
        scanAll: vi.fn().mockResolvedValue([]),
      },
      examDetails: {
        putMany: vi.fn().mockResolvedValue(undefined),
        listByExamId: vi.fn().mockResolvedValue([{ examId: 'dummy', targetId: 'w-verified', sortKey: '001' }]),
        deleteByExamId: vi.fn().mockResolvedValue(undefined),
      },
      kanji: {
        get: vi.fn().mockImplementation(async (id: string) => {
          if (id === 'w-verified') {
            return {
              wordId: 'w-verified',
              subject: '1',
              question: 'チームのけいせいが不利なまま試合が進む。',
              answer: '形成',
              readingHiragana: 'けいせい',
              underlineSpec: { type: 'promptSpan', start: 4, length: 4 },
            } as unknown;
          }
          if (id === 'w-draft') {
            return {
              wordId: 'w-draft',
              subject: '1',
              question: 'チームのけいせいが不利なまま試合が進む。',
              answer: '形成',
            } as unknown;
          }
          return null;
        }),
      },
      s3: {
        putObject: vi.fn().mockResolvedValue(undefined),
      },
      materials: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      questions: {
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        search: vi.fn(),
        listByMaterialId: vi.fn(),
        scanAll: vi.fn().mockResolvedValue([]),
      },
      bedrock: {
        analyzeExamPaper: vi.fn(),
        generateKanjiQuestionReading: vi.fn(),
      },
    } as unknown as Repositories;

    const service = createExamsService(repositories);

    const res = await service.createExam({ subject: '1', mode: 'KANJI', count: 60 });

    expect(res.mode).toBe('KANJI');
    expect(res.count).toBe(1);

    expect(repositories.kanji.get).toHaveBeenCalledWith('w-draft');
    expect(repositories.kanji.get).toHaveBeenCalledWith('w-verified');

    // should lock only the printable candidate
    expect(repositories.examCandidates.lockCandidateIfUnlocked).toHaveBeenCalledTimes(1);

    expect(repositories.s3.putObject).toHaveBeenCalledTimes(1);
  });
});
