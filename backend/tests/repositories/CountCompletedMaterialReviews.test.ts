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
const count = (threshold = 5, excludeExamId?: string) => countCompletedMaterialReviews({
  questionId: 'q1', threshold, excludeExamId,
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
    expect(await count()).toBe(2);
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
    expect(await count()).toBe(0);
  });

  it('falls back to exams.results when detail correctness is missing', async () => {
    get.mockResolvedValue({ Item: exam('e1', { results: [{ id: 'q1', isCorrect: false }] }) });
    query.mockResolvedValue({ Items: [detail('e1')] });
    expect(await count()).toBe(1);
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
    expect(await count(5, 'current')).toBe(2);
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
    expect(await count(1)).toBe(1);
    expect(send).toHaveBeenCalledTimes(21);
    expect(get).toHaveBeenCalledTimes(501);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([4, 5])('stops reading when the threshold %s is reached', async (threshold) => {
    send.mockResolvedValue({
      Items: Array.from({ length: 25 }, (_, i) => ({ examId: `e${i}` })),
      LastEvaluatedKey: { examId: 'next' },
    });
    expect(await count(threshold)).toBe(threshold);
    expect(send).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(threshold);
    expect(query).toHaveBeenCalledTimes(threshold);
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
