import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PutCommand, ScanCommand, DeleteCommand, BatchWriteCommand, type ScanCommandInput } from '@aws-sdk/lib-dynamodb';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getDynamoDbLocal, stopDynamoDbLocal } from '../setup/dynamodbLocal';
import { createRepositories, type Repositories } from '@/repositories/createRepositories';
import { createCompleteExam } from '@/services/exam/completeExam';
import { createSubmitExamResults } from '@/services/exam/submitExamResults';
import { createUpdateExamStatus } from '@/services/exam/updateExamStatus';
import { createDeleteExam } from '@/services/exam/deleteExam';
import { createQuestionExam } from '@/services/exam/createExamQuestion';
import { createApplyChoices } from '@/services/materialQuestions/applyChoices';
import { createDeleteMaterial } from '@/services/materials/deleteMaterial';
import { readSnapshot, planMigration, applyMigration, verifyMigration } from '@/services/materialReviewMigration';
import { dbHelper } from '@/lib/aws';
import type { ExamTable, MaterialQuestionsTable } from '@/types/db';

describe.runIf(process.env.DDB_LOCAL_INTEGRATION === '1')('MATERIAL review transactions on DynamoDB Local', () => {
  let local: Awaited<ReturnType<typeof getDynamoDbLocal>>;
  let repositories: Repositories;
  beforeAll(async () => {
    local = await getDynamoDbLocal();
    repositories = createRepositories();
    repositories.s3 = { ...repositories.s3, deletePrefix: vi.fn() };
    dbHelper.configs.update({ logger: { silent: true } });
  }, 60000);
  afterAll(async () => { await stopDynamoDbLocal(); });
  beforeEach(async () => {
    vi.restoreAllMocks();
    for (const [table, keys] of Object.entries({ material_questions: ['questionId'], materials: ['materialId'], exams: ['examId'], exam_details: ['examId', 'seq'], test_candidates: ['subject', 'candidateKey'], exam_histories: ['id'] })) {
      let key: ScanCommandInput['ExclusiveStartKey'];
      do {
        const rows = await local.docClient.send(new ScanCommand({ TableName: table, ExclusiveStartKey: key }));
        for (const row of rows.Items ?? []) await local.docClient.send(new DeleteCommand({ TableName: table, Key: Object.fromEntries(keys.map((key) => [key, row[key]])) }));
        key = rows.LastEvaluatedKey;
      } while (key);
    }
    await local.docClient.send(new PutCommand({ TableName: 'materials', Item: { materialId: 'm', subjectId: '1', title: 'm', questionCount: 1, grade: '1', provider: 'p', materialDate: '2026-01-01', isCompleted: true } }));
  });
  const question = async (count = 0, initialized = true, id = 'q') => {
    const row: MaterialQuestionsTable = { questionId: id, materialId: 'm', subjectId: '1', number: 1, canonicalKey: id, choice: 'INCORRECT',
      ...(initialized ? { reviewCount: count, reviewPolicyVersion: 2, ...(count ? { countedExamIds: new Set(Array.from({ length: count }, (_, i) => `old${i}`)) } : {}) } : {}),
    };
    await local.docClient.send(new PutCommand({ TableName: 'material_questions', Item: row }));
    return row;
  };
  const exam = async (id = 'e', correct: boolean | null = true, ids = ['q']) => {
    await repositories.exams.put({ examId: id, mode: 'MATERIAL', status: 'IN_PROGRESS', subject: '1', count: ids.length, createdDate: '2026-01-01' });
    await repositories.examDetails.putMany(id, ids, 'MATERIAL');
    for (const questionId of ids) {
      const candidate = await repositories.examCandidates.createCandidate({ subject: '1', questionId, materialId: 'm', mode: 'MATERIAL', nextTime: '2026-01-01', correctCount: 0, status: 'OPEN' });
      if (candidate) expect(await repositories.examCandidates.lockCandidateIfUnlocked({ subject: '1', candidateKey: candidate.candidateKey, examId: id })).toBe(true);
    }
    if (correct !== null) await createSubmitExamResults(repositories, id, { date: '2026-01-01', results: ids.map((questionId) => ({ id: questionId, isCorrect: correct })) });
  };
  const candidates = async () => (await readSnapshot()).candidates;

  it.each([[0, true, 1], [4, true, 5], [4, false, 5]] as const)('past %i + result %s = %i', async (past, correct, expected) => {
    await question(past); await exam('e', correct); await createCompleteExam(repositories, 'e');
    const q = await repositories.materialQuestions.get('q');
    expect(q?.reviewCount).toBe(expected); expect(q?.countedExamIds?.size).toBe(expected);
    expect(await candidates()).toHaveLength(expected < 5 ? 1 : 0);
    expect((await repositories.exams.get('e'))?.status).toBe('COMPLETED');
    expect(verifyMigration(await readSnapshot())).toEqual([]);
  });
  it.each([true, false])('five results (%s) exclude only on the fifth; sixth is not selected', async (correct) => {
    await question();
    for (let i = 1; i <= 5; i++) {
      await exam(`e${i}`, correct); await createCompleteExam(repositories, `e${i}`);
      expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(i);
      expect(await candidates()).toHaveLength(i < 5 ? 1 : 0);
    }
    const created = await createQuestionExam({ repositories } as Parameters<typeof createQuestionExam>[0], { mode: 'MATERIAL', subject: '1', count: 1, materialIds: ['m'] });
    expect(created.count).toBe(0);
  });
  it('ungraded review and initial material choice do not count', async () => {
    await question(); await createApplyChoices(repositories)({ materialId: 'm', baseDateYmd: '2026-01-01' });
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(0);
    await exam('e', null); await createCompleteExam(repositories, 'e');
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(0);
    expect((await repositories.examDetails.listByExamId('e'))[0].reviewProcessed).toBe(true);
  });
  it('concurrent completion and repeated API requests count once', async () => {
    await question(); await exam();
    await Promise.all(Array.from({ length: 8 }, () => createCompleteExam(repositories, 'e')));
    await createCompleteExam(repositories, 'e');
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(1);
    expect((await readSnapshot()).histories).toHaveLength(1);
    expect(await candidates()).toHaveLength(1);
  });
  it('counts graded details and preserves audit history even when the locked candidate is missing', async () => {
    await question(); await exam();
    const candidate = (await candidates())[0];
    await repositories.examCandidates.deleteCandidate({ subject: candidate.subject, candidateKey: candidate.candidateKey });
    await createCompleteExam(repositories, 'e'); await createCompleteExam(repositories, 'e');
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(1);
    expect((await readSnapshot()).histories).toHaveLength(1);
    expect(await candidates()).toHaveLength(1);
  });
  it('rolls back a failed question transaction and safely resumes after a committed question', async () => {
    await question(); await question(0, true, 'q2'); await exam('e', false, ['q', 'q2']);
    const original = dbHelper.transactWrite;
    const spy = vi.spyOn(dbHelper, 'transactWrite');
    spy.mockImplementation(async (input) => {
      if (input.TransactItems?.some((item) => item.Update?.TableName === 'material_questions' && item.Update.Key?.questionId === 'q2')) {
        return original({ ...input, TransactItems: [...input.TransactItems!, { ConditionCheck: { TableName: 'materials', Key: { materialId: 'missing' }, ConditionExpression: 'attribute_exists(materialId)' } }] });
      }
      return original(input);
    });
    await expect(createCompleteExam(repositories, 'e')).rejects.toThrow();
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(1);
    expect((await repositories.materialQuestions.get('q2'))?.reviewCount).toBe(0);
    expect((await repositories.exams.get('e'))?.status).toBe('IN_PROGRESS');
    await expect(createSubmitExamResults(repositories, 'e', { results: [{ id: 'q', isCorrect: true }] })).rejects.toThrow();
    await expect(createDeleteExam(repositories, 'e')).rejects.toThrow();
    spy.mockRestore(); await createCompleteExam(repositories, 'e');
    const snapshot = await readSnapshot();
    expect(snapshot.questions.map((q) => q.reviewCount)).toEqual([1, 1]);
    expect(snapshot.histories).toHaveLength(2); expect(snapshot.candidates).toHaveLength(2);
    expect(verifyMigration(snapshot)).toEqual([]);
  });
  it('failure after commit, before response is retried without duplicating writes', async () => {
    await question(); await exam();
    const original = dbHelper.transactWrite;
    vi.spyOn(dbHelper, 'transactWrite').mockImplementationOnce(async (input) => { await original(input); throw new Error('lost response'); });
    await expect(createCompleteExam(repositories, 'e')).rejects.toThrow('lost response');
    await createCompleteExam(repositories, 'e');
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(1);
    expect((await readSnapshot()).histories).toHaveLength(1);
  });
  it('cannot complete while grading is partially synced; resubmit recovers', async () => {
    await question(); await exam('e', null);
    vi.spyOn(dbHelper, 'transactWrite').mockRejectedValueOnce(new Error('grading failure'));
    await expect(createSubmitExamResults(repositories, 'e', { results: [{ id: 'q', isCorrect: false }] })).rejects.toThrow();
    await expect(createCompleteExam(repositories, 'e')).rejects.toThrow();
    await createSubmitExamResults(repositories, 'e', { results: [{ id: 'q', isCorrect: true }] });
    await createCompleteExam(repositories, 'e');
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(1);
  });
  it('status API uses counting; completed deletion preserves the ledger', async () => {
    await question(4); await exam('e', false);
    await createUpdateExamStatus(repositories, 'e', { status: 'COMPLETED' });
    await expect(createUpdateExamStatus(repositories, 'e', { status: 'IN_PROGRESS' })).rejects.toThrow();
    await expect(createSubmitExamResults(repositories, 'e', { results: [{ id: 'q', isCorrect: true }] })).rejects.toThrow();
    await createDeleteExam(repositories, 'e');
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(5);
    expect(await candidates()).toHaveLength(0);
  });
  it('blocks all candidate regeneration routes at 5 and preserves fields on updates', async () => {
    await question(5);
    await createApplyChoices(repositories)({ materialId: 'm', baseDateYmd: '2026-01-01' });
    expect(await repositories.examCandidates.createCandidate({ subject: '1', questionId: 'q', materialId: 'm', mode: 'MATERIAL', nextTime: '2026-01-01', correctCount: 0, status: 'OPEN' })).toBeNull();
    await repositories.examCandidates.bulkCreateCandidates([{ subject: '1', questionId: 'q', materialId: 'm', mode: 'MATERIAL', nextTime: '2026-01-01', correctCount: 0, status: 'OPEN', id: 'c', candidateKey: '2026-01-01#c', createdAt: '2026-01-01' }]);
    await repositories.materialQuestions.update('q', { canonicalKey: 'updated' });
    await repositories.materialQuestions.bulkUpdateChoices([{ questionId: 'q', isCorrect: false }]);
    await expect(repositories.materialQuestions.create((await repositories.materialQuestions.get('q'))!)).rejects.toThrow();
    expect((await repositories.materialQuestions.get('q'))?.countedExamIds?.size).toBe(5);
    expect(await candidates()).toHaveLength(0);
  });
  it('initializes new questions at zero, prevents missing migration from proceeding, and avoids concurrent candidate duplicates', async () => {
    const row = await question(0, false);
    await expect(repositories.examCandidates.createCandidate({ subject: '1', questionId: 'q', materialId: 'm', mode: 'MATERIAL', nextTime: '2026-01-01', correctCount: 0, status: 'OPEN' })).rejects.toThrow();
    await repositories.materialQuestions.create({ ...row, questionId: 'new' });
    expect((await repositories.materialQuestions.get('new'))?.reviewCount).toBe(0);
    const params = { subject: '1' as const, questionId: 'new', materialId: 'm', mode: 'MATERIAL' as const, nextTime: '2026-01-01', correctCount: 0, status: 'OPEN' as const };
    await Promise.all(Array.from({ length: 6 }, () => repositories.examCandidates.createCandidate(params)));
    expect(await candidates()).toHaveLength(1);
  });
  it('migrates historical exclusion, reruns unchanged, keeps history and handles interruption', async () => {
    await question(0, false); await question(0, false, 'q2');
    for (let i = 1; i <= 2; i++) {
      const e: ExamTable = { examId: `old${i}`, mode: 'MATERIAL', status: 'COMPLETED', subject: '1', count: 2, createdDate: `2026-01-0${i}`, results: [{ id: 'q', isCorrect: true }, { id: 'q2', isCorrect: false }] };
      await repositories.exams.put(e); await repositories.examDetails.putMany(e.examId, ['q', 'q2'], 'MATERIAL');
    }
    await repositories.examHistories.putHistory({ id: 'audit', subject: '1', questionId: 'q', mode: 'MATERIAL', status: 'EXCLUDED', correctCount: 2, nextTime: '2099-12-31', closedAt: '2026-01-02' });
    const before = await readSnapshot(); const plan = planMigration(before);
    expect(plan.summary.restore).toBe(2);
    const original = dbHelper.transactWrite;
    vi.spyOn(dbHelper, 'transactWrite').mockImplementationOnce(original).mockRejectedValueOnce(new Error('migration interrupted'));
    await expect(applyMigration(before, plan)).rejects.toThrow('migration interrupted');
    vi.restoreAllMocks();
    const retry = await readSnapshot(); await applyMigration(retry, planMigration(retry));
    const after = await readSnapshot();
    expect(after.questions.map((q) => q.reviewCount)).toEqual([2, 2]);
    expect(after.candidates.map((c) => c.nextTime).sort()).toEqual(['2026-02-01', '2026-04-02']);
    expect(after.histories).toHaveLength(1);
    expect(verifyMigration(after)).toEqual([]);
    expect(await applyMigration(after, planMigration(after))).toBe(0);
    expect(await readSnapshot()).toEqual(after);
    expect((await repositories.materials.get('m'))?.openCandidateCount).toBe(2);
    const restored = await createQuestionExam({ repositories } as Parameters<typeof createQuestionExam>[0], { mode: 'MATERIAL', subject: '1', count: 2, materialIds: ['m'] });
    expect(restored.count).toBe(2);
  });
  it('material deletion preserves other questions processing markers and counters', async () => {
    await question();
    await local.docClient.send(new PutCommand({ TableName: 'materials', Item: { materialId: 'm2', subjectId: '1', title: 'm2', questionCount: 1, grade: '1', provider: 'p', materialDate: '2026-01-01', isCompleted: true } }));
    const other = await question(0, true, 'other');
    await local.docClient.send(new PutCommand({ TableName: 'material_questions', Item: { ...other, materialId: 'm2' } }));
    await exam('e', true, ['q', 'other']); await createCompleteExam(repositories, 'e');
    await createDeleteMaterial(repositories, 'm');
    expect(await repositories.materialQuestions.get('q')).toBeNull();
    await expect(repositories.materialQuestions.update('q', { canonicalKey: 'must-not-return' })).rejects.toThrow();
    await expect(repositories.materialQuestions.bulkUpdateChoices([{ questionId: 'q', isCorrect: false }])).rejects.toThrow();
    expect((await repositories.exams.get('e'))?.status).toBe('COMPLETED');
    expect((await repositories.materialQuestions.get('other'))?.reviewCount).toBe(1);
    expect(await repositories.examDetails.listByExamId('e')).toEqual([expect.objectContaining({ targetId: 'other', isCorrect: true, reviewProcessed: true })]);
    expect(await candidates()).toHaveLength(1);
    expect((await readSnapshot()).histories).toHaveLength(2);
  });
  it('paginates beyond 500 and 1MB without undercounting and removes the fifth-review candidate', async () => {
    await question(0, false);
    const exams: ExamTable[] = Array.from({ length: 601 }, (_, i) => ({ examId: `history${i}`, mode: 'MATERIAL', status: 'COMPLETED', subject: '1', count: 1, createdDate: '2026-01-01' }));
    const details = exams.map((e) => ({ examId: e.examId, seq: 0, targetId: 'q', targetType: 'MATERIAL', isCorrect: false, padding: 'x'.repeat(3000) }));
    for (const [table, rows] of [['exams', exams], ['exam_details', details]] as const) {
      for (let i = 0; i < rows.length; i += 25) {
        const result = await local.docClient.send(new BatchWriteCommand({ RequestItems: { [table]: rows.slice(i, i + 25).map((row) => ({ PutRequest: { Item: row } })) } }));
        expect(Object.keys(result.UnprocessedItems ?? {})).toHaveLength(0);
      }
    }
    await local.docClient.send(new PutCommand({ TableName: 'test_candidates', Item: { id: 'old', subject: '1', candidateKey: '2026-01-01#old', questionId: 'q', materialId: 'm', mode: 'MATERIAL', status: 'OPEN', correctCount: 0, nextTime: '2026-01-01', createdAt: '2026-01-01' } }));
    const before = await readSnapshot(); const plan = planMigration(before);
    expect(plan.rows[0].historyCount).toBe(601);
    await applyMigration(before, plan);
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(5);
    expect(await candidates()).toHaveLength(0);
    expect(verifyMigration(await readSnapshot())).toEqual([]);
  }, 30000);
  it('executes the CLI default dry-run, apply and second apply against local fixtures only', async () => {
    await question(0, false);
    await repositories.exams.put({ examId: 'historical', mode: 'MATERIAL', status: 'COMPLETED', subject: '1', count: 1, createdDate: '2026-01-01', results: [{ id: 'q', isCorrect: true }] });
    await repositories.examDetails.putMany('historical', ['q'], 'MATERIAL');
    const folder = await mkdtemp(join(tmpdir(), 'smart-exam-migration-'));
    const report = join(folder, 'report.json');
    const run = (args: string[]) => execFileSync('yarn', ['workspace', 'smart-exam-backend', 'exec', 'tsx', 'scripts/migrate-material-review-v2.ts', ...args, '--report', report], { env: { ...process.env, AWS_ENDPOINT_URL: local.endpoint }, stdio: 'pipe' });
    run([]);
    expect((await repositories.materialQuestions.get('q'))?.reviewPolicyVersion).toBeUndefined();
    expect(JSON.parse(await readFile(report, 'utf8')).mode).toBe('dry-run');
    run(['--apply', '--maintenance-confirmed']);
    expect((await repositories.materialQuestions.get('q'))?.reviewCount).toBe(1);
    run(['--apply', '--maintenance-confirmed']);
    expect(JSON.parse(await readFile(report, 'utf8'))).toMatchObject({ processed: 0, violations: [], beforeTotal: 1, afterTotal: 1 });
  }, 30000);
  it('KANJI completion still excludes after the third consecutive correct answer', async () => {
    await repositories.exams.put({ examId: 'k', mode: 'KANJI', status: 'IN_PROGRESS', subject: '1', count: 1, createdDate: '2026-01-01', results: [{ id: 'word', isCorrect: true }] });
    await repositories.examDetails.putMany('k', ['word'], 'KANJI');
    const c = await repositories.examCandidates.createCandidate({ subject: '1', questionId: 'word', mode: 'KANJI', nextTime: '2026-01-01', correctCount: 2, status: 'OPEN' });
    await repositories.examCandidates.lockCandidateIfUnlocked({ subject: '1', candidateKey: c!.candidateKey, examId: 'k' });
    await createCompleteExam(repositories, 'k');
    expect(await candidates()).toHaveLength(0);
    expect((await readSnapshot()).histories.some((h) => h.mode === 'KANJI' && h.status === 'EXCLUDED' && h.correctCount === 3)).toBe(true);
  });
});
