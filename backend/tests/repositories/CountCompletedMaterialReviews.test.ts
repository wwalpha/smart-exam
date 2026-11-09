import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExamDetailTable, ExamTable } from '@/types/db';

const { send, get, query } = vi.hoisted(() => ({ send: vi.fn(), get: vi.fn(), query: vi.fn() }));
vi.mock('@/lib/aws', () => ({ dbHelper: { getDocumentClient: () => ({ send }), get, query } }));
vi.mock('@/lib/env', () => ({ ENV: { TABLE_EXAM_DETAILS: 'exam_details', TABLE_EXAMS: 'exams' } }));

import { countCompletedMaterialReviews } from '@/repositories/examDetails/countCompletedMaterialReviews';
import { listExamIdsByTargetId } from '@/repositories/examDetails/listExamIdsByTargetId';

const exam = (examId: string, overrides: Partial<ExamTable> = {}): ExamTable => ({
  examId, mode: 'MATERIAL', status: 'COMPLETED', subject: '1', count: 1, createdDate: '2026-01-01',
  ...overrides,
});
const detail = (examId: string, isCorrect?: boolean, targetId = 'q1'): ExamDetailTable => ({
  examId, seq: 0, targetType: 'MATERIAL', targetId, isCorrect,
});
const count = (excludeExamId?: string) => countCompletedMaterialReviews({
  questionId: 'q1', excludeExamId,
});

describe('countCompletedMaterialReviews', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    send.mockResolvedValue({ Items: [{ examId: 'e1' }] });
    get.mockImplementation(async ({ Key }) => ({ Item: exam(Key.examId) }));
    query.mockImplementation(async ({ ExpressionAttributeValues }) => ({
      Items: [detail(ExpressionAttributeValues[':examId'], true)],
    }));
  });

  it('counts both correct and incorrect completed answers using consistent base-table reads', async () => {
    send.mockResolvedValue({ Items: [{ examId: 'e1' }, { examId: 'e2' }] });
    query.mockResolvedValueOnce({ Items: [detail('e1', true)] })
      .mockResolvedValueOnce({ Items: [detail('e2', false)] });
    expect(await count()).toEqual({ completedCountUpTo3: 2, hasAnyCorrect: true });
    expect(get.mock.calls.every(([input]) => input.ConsistentRead === true)).toBe(true);
    expect(query.mock.calls.every(([input]) => input.ConsistentRead === true)).toBe(true);
    expect(send.mock.calls[0][0].input).toEqual(expect.objectContaining({
      TableName: 'exam_details', IndexName: 'gsi_target_id_exam_id',
      KeyConditionExpression: '#targetId = :targetId', ExpressionAttributeValues: { ':targetId': 'q1' },
      Limit: 25,
    }));
  });

  it.each([
    ['ungraded', exam('e1'), [detail('e1')]],
    ['in progress', exam('e1', { status: 'IN_PROGRESS' }), [detail('e1', true)]],
    ['KANJI', exam('e1', { mode: 'KANJI' }), [detail('e1', true)]],
    ['other question', exam('e1', { results: [{ id: 'q1', isCorrect: true }] }), [detail('e1', true, 'q2')]],
    ['missing exam', null, [detail('e1', true)]],
  ])('does not count %s', async (_name, item, details) => {
    get.mockResolvedValue({ Item: item });
    query.mockResolvedValue({ Items: details });
    expect(await count()).toEqual({ completedCountUpTo3: 0, hasAnyCorrect: false });
  });

  it('falls back to exams.results when detail correctness is missing', async () => {
    get.mockResolvedValue({ Item: exam('e1', { results: [{ id: 'q1', isCorrect: false }] }) });
    query.mockResolvedValue({ Items: [detail('e1')] });
    expect(await count()).toEqual({ completedCountUpTo3: 1, hasAnyCorrect: false });
  });

  it.each([
    [[detail('e1', true)], [{ id: 'q1', isCorrect: false }]],
    [[detail('e1', true), { ...detail('e1', false), seq: 1 }], []],
    [[detail('e1')], [{ id: 'q1', isCorrect: true }, { id: 'q1', isCorrect: false }]],
  ])('rejects contradictory results', async (details, results) => {
    get.mockResolvedValue({ Item: exam('e1', { results }) });
    query.mockResolvedValue({ Items: details });
    await expect(count()).rejects.toMatchObject({ errorCodes: ['inconsistent_material_review_results'] });
  });

  it('deduplicates exam IDs across pages and excludes the current exam', async () => {
    const cursor = { targetId: 'q1', examId: 'e1', seq: 0 };
    send.mockResolvedValueOnce({ Items: [{ examId: 'current' }, { examId: 'e1' }], LastEvaluatedKey: cursor })
      .mockResolvedValueOnce({ Items: [{ examId: 'e1' }, { examId: 'e2' }] });
    query.mockImplementation(async ({ ExpressionAttributeValues }) => ({
      Items: [detail(ExpressionAttributeValues[':examId'], true), {
        ...detail(ExpressionAttributeValues[':examId'], true), seq: 1,
      }],
    }));
    expect(await count('current')).toEqual({ completedCountUpTo3: 2, hasAnyCorrect: true });
    expect(get).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].input.ExclusiveStartKey).toEqual(cursor);
  });

  it('paginates through more than 500 unqualified histories', async () => {
    send.mockImplementation(async ({ input }) => {
      const start = input.ExclusiveStartKey?.offset ?? 0;
      const end = Math.min(start + input.Limit, 501);
      return {
        Items: Array.from({ length: end - start }, (_, i) => ({ examId: `e${start + i}` })),
        LastEvaluatedKey: end < 501 ? { offset: end } : undefined,
      };
    });
    get.mockImplementation(async ({ Key }) => ({
      Item: exam(Key.examId, { mode: Key.examId === 'e500' ? 'MATERIAL' : 'KANJI' }),
    }));
    expect(await count()).toEqual({ completedCountUpTo3: 1, hasAnyCorrect: true });
    expect(send).toHaveBeenCalledTimes(21);
    expect(get).toHaveBeenCalledTimes(501);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('stops after three completed reviews once a correct answer is found', async () => {
    send.mockResolvedValue({
      Items: Array.from({ length: 25 }, (_, i) => ({ examId: `e${i}` })),
      LastEvaluatedKey: { examId: 'next' },
    });
    expect(await count()).toEqual({ completedCountUpTo3: 3, hasAnyCorrect: true });
    expect(send).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('continues through all pages after three incorrect answers to find a later correct answer', async () => {
    send.mockResolvedValueOnce({ Items: ['e1', 'e2', 'e3', 'e4'].map((examId) => ({ examId })), LastEvaluatedKey: { examId: 'e4' } })
      .mockResolvedValueOnce({ Items: [{ examId: 'e5' }] });
    query.mockImplementation(async ({ ExpressionAttributeValues }) => ({
      Items: [detail(ExpressionAttributeValues[':examId'], ExpressionAttributeValues[':examId'] === 'e5')],
    }));
    expect(await count()).toEqual({ completedCountUpTo3: 3, hasAnyCorrect: true });
    expect(get).toHaveBeenCalledTimes(5);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('scans all incorrect histories without imposing a limit', async () => {
    send.mockResolvedValueOnce({ Items: ['e1', 'e2', 'e3'].map((examId) => ({ examId })), LastEvaluatedKey: { examId: 'e3' } })
      .mockResolvedValueOnce({ Items: ['e4', 'e5', 'e6'].map((examId) => ({ examId })) });
    query.mockImplementation(async ({ ExpressionAttributeValues }) => ({ Items: [detail(ExpressionAttributeValues[':examId'], false)] }));
    expect(await count()).toEqual({ completedCountUpTo3: 3, hasAnyCorrect: false });
    expect(get).toHaveBeenCalledTimes(6);
  });

  it.each([['index', send], ['exam', get], ['detail', query]] as const)('propagates %s read errors', async (_source, mock) => {
    mock.mockRejectedValue(new Error('read failed'));
    await expect(count()).rejects.toThrow('read failed');
  });

  it('preserves the existing listExamIdsByTargetId contract', async () => {
    query.mockResolvedValue({ Items: [{ examId: 'e1' }, { examId: 'e1' }, { examId: 'e2' }] });
    expect(await listExamIdsByTargetId('q1')).toEqual(['e1', 'e2']);
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ Limit: 500 }));
  });
});
