import { describe, expect, it, vi } from 'vitest';
import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, ExamDetailTable, ExamTable } from '@/types/db';
import { createCompleteExam } from '@/services/exam/completeExam';
import { createApplyChoices } from '@/services/materialQuestions/applyChoices';

const fixture = (params: {
  pastCount?: number;
  isCorrect?: boolean;
  mode?: ExamTable['mode'];
  correctCount?: number;
  status?: ExamTable['status'];
} = {}) => {
  const test: ExamTable = {
    examId: 'current', subject: '1', mode: params.mode ?? 'MATERIAL', status: params.status ?? 'IN_PROGRESS',
    count: 1, createdDate: '2026-01-01', submittedDate: '2026-01-01',
  };
  const candidate: ExamCandidateTable = {
    id: 'c1', questionId: 'q1', materialId: 'm1', subject: '1', mode: test.mode, status: 'LOCKED',
    examId: 'current', candidateKey: '2026-01-01#c1', nextTime: '2026-01-01',
    correctCount: params.correctCount ?? 0, createdAt: '2025-12-01T00:00:00Z',
  };
  const details: ExamDetailTable[] = [{
    examId: 'current', seq: 0, targetId: 'q1', targetType: test.mode, isCorrect: params.isCorrect,
  }];
  const repos = {
    exams: { get: vi.fn().mockResolvedValue(test), put: vi.fn() },
    examDetails: {
      listByExamId: vi.fn().mockResolvedValue(details),
      countCompletedMaterialReviews: vi.fn().mockResolvedValue(params.pastCount ?? 0),
    },
    examCandidates: {
      listLockedCandidatesByExamId: vi.fn().mockResolvedValue([candidate]),
      deleteCandidate: vi.fn(), createCandidate: vi.fn(), syncMaterialOpenCandidateCount: vi.fn(),
    },
    examHistories: { putHistory: vi.fn() },
    materials: { get: vi.fn().mockResolvedValue({ materialId: 'm1' }) },
    materialQuestions: {
      listByMaterialId: vi.fn().mockResolvedValue([
        { questionId: 'q1', materialId: 'm1', subjectId: '1', choice: 'INCORRECT' },
      ]),
    },
  };
  return { repos, repositories: repos as unknown as Repositories, test, candidate, details };
};

describe('MATERIAL completeExam', () => {
  it.each([
    [0, true, 0, '2026-04-01'],
    [0, false, 0, '2026-01-31'],
    [3, true, 2, '2026-04-01'],
    [3, false, 0, '2026-01-31'],
  ])('requeues past %s plus current %s with streak %s', async (pastCount, isCorrect, correctCount, nextTime) => {
    const { repos, repositories, candidate } = fixture({ pastCount, isCorrect, correctCount });
    expect(await createCompleteExam(repositories, 'current')).toBe(true);
    expect(repos.examDetails.countCompletedMaterialReviews).toHaveBeenCalledWith({
      questionId: 'q1', threshold: 4, excludeExamId: 'current',
    });
    expect(repos.examHistories.putHistory).toHaveBeenCalledOnce();
    expect(repos.examHistories.putHistory).toHaveBeenCalledWith(expect.objectContaining({
      id: candidate.id, status: 'CLOSED', correctCount, nextTime: candidate.nextTime,
    }));
    expect(repos.examCandidates.createCandidate).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'MATERIAL', questionId: 'q1', materialId: 'm1', status: 'OPEN', nextTime,
    }));
    expect(repos.exams.put).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }));
    expect(repos.examCandidates.syncMaterialOpenCandidateCount).toHaveBeenCalledOnce();
    expect(repos.examCandidates.syncMaterialOpenCandidateCount).toHaveBeenCalledWith('m1');
  });

  it.each([[4, true], [4, false], [5, true], [5, false]])(
    'excludes past %s plus current %s regardless of correctness', async (pastCount, isCorrect) => {
      const { repos, repositories, candidate } = fixture({ pastCount, isCorrect });
      await createCompleteExam(repositories, 'current');
      expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
      expect(repos.examHistories.putHistory.mock.calls.map(([history]) => history.status)).toEqual(['CLOSED', 'EXCLUDED']);
      const excluded = repos.examHistories.putHistory.mock.calls[1][0];
      expect(excluded).toEqual({
        id: expect.any(String), subject: '1', questionId: 'q1', mode: 'MATERIAL', status: 'EXCLUDED',
        correctCount: isCorrect ? 1 : 0, nextTime: '2099-12-31', closedAt: expect.any(String),
      });
      expect(repos.examCandidates.deleteCandidate).toHaveBeenCalledWith({
        subject: candidate.subject, candidateKey: candidate.candidateKey,
      });
      expect(repos.examDetails.countCompletedMaterialReviews.mock.invocationCallOrder[0])
        .toBeLessThan(repos.examHistories.putHistory.mock.invocationCallOrder[0]);
      expect(repos.examHistories.putHistory.mock.invocationCallOrder[0])
        .toBeLessThan(repos.examCandidates.deleteCandidate.mock.invocationCallOrder[0]);
      expect(repos.examCandidates.syncMaterialOpenCandidateCount).toHaveBeenCalledOnce();
      expect(repos.examCandidates.syncMaterialOpenCandidateCount).toHaveBeenCalledWith('m1');
    },
  );

  it('uses the current exam result when detail correctness is absent', async () => {
    const { repos, repositories, test } = fixture({ pastCount: 4 });
    test.results = [{ id: 'q1', isCorrect: false }];
    await createCompleteExam(repositories, 'current');
    expect(repos.examDetails.countCompletedMaterialReviews).toHaveBeenCalledOnce();
    expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
    expect(repos.examHistories.putHistory.mock.calls[1][0].status).toBe('EXCLUDED');
  });

  it('preserves ungraded completion without history reads or requeueing', async () => {
    const { repos, repositories } = fixture();
    await createCompleteExam(repositories, 'current');
    expect(repos.examDetails.countCompletedMaterialReviews).not.toHaveBeenCalled();
    expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
    expect(repos.examCandidates.deleteCandidate).toHaveBeenCalledOnce();
    expect(repos.examHistories.putHistory.mock.calls.map(([history]) => history.status)).toEqual(['CLOSED']);
  });

  it('finishes all history checks before deleting any candidate', async () => {
    const { repos, repositories, candidate, details } = fixture({ isCorrect: true });
    repos.examCandidates.listLockedCandidatesByExamId.mockResolvedValue([
      candidate, { ...candidate, id: 'c2', questionId: 'q2', candidateKey: '2026-01-01#c2' },
    ]);
    details.push({ examId: 'current', seq: 1, targetId: 'q2', targetType: 'MATERIAL', isCorrect: false });
    repos.examDetails.countCompletedMaterialReviews.mockResolvedValueOnce(0).mockRejectedValueOnce(new Error('read failed'));
    await expect(createCompleteExam(repositories, 'current')).rejects.toThrow('read failed');
    expect(repos.examCandidates.deleteCandidate).not.toHaveBeenCalled();
    expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
    expect(repos.examHistories.putHistory).not.toHaveBeenCalled();
    expect(repos.exams.put).not.toHaveBeenCalled();
  });

  it('rejects conflicting current results before candidate deletion', async () => {
    const { repos, repositories, test } = fixture({ isCorrect: true });
    test.results = [{ id: 'q1', isCorrect: false }];
    await expect(createCompleteExam(repositories, 'current')).rejects.toMatchObject({
      errorCodes: ['inconsistent_material_review_results'],
    });
    expect(repos.examCandidates.deleteCandidate).not.toHaveBeenCalled();
    expect(repos.examHistories.putHistory).not.toHaveBeenCalled();
  });

  it('returns successfully without writes when already completed', async () => {
    const { repos, repositories } = fixture({ status: 'COMPLETED', isCorrect: true });
    expect(await createCompleteExam(repositories, 'current')).toBe(true);
    expect(repos.examDetails.listByExamId).not.toHaveBeenCalled();
    expect(repos.examDetails.countCompletedMaterialReviews).not.toHaveBeenCalled();
    expect(repos.examCandidates.deleteCandidate).not.toHaveBeenCalled();
    expect(repos.examHistories.putHistory).not.toHaveBeenCalled();
    expect(repos.exams.put).not.toHaveBeenCalled();
  });

  it('preserves KANJI exclusion at three consecutive correct answers without MATERIAL reads', async () => {
    const { repos, repositories } = fixture({ mode: 'KANJI', isCorrect: true, correctCount: 2 });
    await createCompleteExam(repositories, 'current');
    expect(repos.examDetails.countCompletedMaterialReviews).not.toHaveBeenCalled();
    expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
    expect(repos.examHistories.putHistory.mock.calls[1][0]).toEqual(expect.objectContaining({
      mode: 'KANJI', status: 'EXCLUDED', correctCount: 3, nextTime: '2099-12-31',
    }));
    expect(repos.examCandidates.syncMaterialOpenCandidateCount).not.toHaveBeenCalled();
  });
});

describe('MATERIAL applyChoices', () => {
  it('checks questions in parallel and waits for registration before syncing the count', async () => {
    const { repos, repositories } = fixture();
    repos.materialQuestions.listByMaterialId.mockResolvedValue([
      { questionId: 'q1', materialId: 'm1', subjectId: '1', choice: 'INCORRECT' },
      { questionId: 'q2', materialId: 'm1', subjectId: '1', choice: 'INCORRECT' },
    ]);
    let finishHistory!: (count: number) => void;
    repos.examDetails.countCompletedMaterialReviews.mockReturnValue(new Promise<number>((resolve) => {
      finishHistory = resolve;
    }));
    const applying = createApplyChoices(repositories)({ materialId: 'm1', baseDateYmd: '2026-01-01' });
    await vi.waitFor(() => expect(repos.examDetails.countCompletedMaterialReviews).toHaveBeenCalledTimes(2));
    expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
    expect(repos.examCandidates.syncMaterialOpenCandidateCount).not.toHaveBeenCalled();
    finishHistory(0);
    await applying;
    expect(repos.examCandidates.createCandidate).toHaveBeenCalledTimes(2);
    expect(repos.examCandidates.syncMaterialOpenCandidateCount).toHaveBeenCalledOnce();
    expect(repos.examCandidates.createCandidate.mock.invocationCallOrder[1])
      .toBeLessThan(repos.examCandidates.syncMaterialOpenCandidateCount.mock.invocationCallOrder[0]);
  });

  it.each([[0, true], [4, true], [5, false], [6, false]])(
    'past count %s permits registration %s without counting the initial grading', async (pastCount, registers) => {
      const { repos, repositories } = fixture({ pastCount });
      await createApplyChoices(repositories)({ materialId: 'm1', baseDateYmd: '2026-01-01' });
      expect(repos.examDetails.countCompletedMaterialReviews).toHaveBeenCalledOnce();
      expect(repos.examDetails.countCompletedMaterialReviews).toHaveBeenCalledWith({
        questionId: 'q1', threshold: 5,
      });
      expect(repos.examCandidates.createCandidate).toHaveBeenCalledTimes(registers ? 1 : 0);
      if (registers) expect(repos.examCandidates.createCandidate).toHaveBeenCalledWith(expect.objectContaining({
        mode: 'MATERIAL', nextTime: '2026-01-31', correctCount: 0,
      }));
      expect(repos.exams.put).not.toHaveBeenCalled();
      expect(repos.examCandidates.syncMaterialOpenCandidateCount).toHaveBeenCalledOnce();
      expect(repos.examCandidates.syncMaterialOpenCandidateCount).toHaveBeenCalledWith('m1');
    },
  );

  it.each(['CORRECT', undefined])('does not read history or register choice %s', async (choice) => {
    const { repos, repositories } = fixture();
    repos.materialQuestions.listByMaterialId.mockResolvedValue([
      { questionId: 'q1', materialId: 'm1', subjectId: '1', choice },
    ]);
    await createApplyChoices(repositories)({ materialId: 'm1', baseDateYmd: '2026-01-01' });
    expect(repos.examDetails.countCompletedMaterialReviews).not.toHaveBeenCalled();
    expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
  });

  it('does not register a candidate when history lookup fails', async () => {
    const { repos, repositories } = fixture();
    repos.examDetails.countCompletedMaterialReviews.mockRejectedValue(new Error('read failed'));
    await expect(createApplyChoices(repositories)({ materialId: 'm1', baseDateYmd: '2026-01-01' }))
      .rejects.toThrow('read failed');
    expect(repos.examCandidates.createCandidate).not.toHaveBeenCalled();
  });
});
