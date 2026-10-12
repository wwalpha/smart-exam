import { describe, expect, it } from 'vitest';
import { planMigration, type Snapshot } from '@/services/materialReviewMigration';

const fixture = (): Snapshot => ({
  exams: [], details: [], candidates: [], histories: [],
  questions: [{ questionId: 'q', materialId: 'm', subjectId: '1', number: 1, canonicalKey: '1', choice: 'INCORRECT' }],
  materials: [{ materialId: 'm', subjectId: '1', title: 'm', questionCount: 1, grade: '1', provider: 'p', materialDate: '2026-01-01', isCompleted: true }],
});
const add = (data: Snapshot, id: string, correct?: boolean) => {
  data.exams.push({ examId: id, mode: 'MATERIAL', status: 'COMPLETED', subject: '1', count: 1, createdDate: '2026-01-01' });
  data.details.push({ examId: id, seq: 0, targetId: 'q', targetType: 'MATERIAL', isCorrect: correct });
};

describe('MATERIAL migration aggregation', () => {
  it('counts over 500 exams, boolean results only, deduplicated and capped at 5', () => {
    const data = fixture();
    for (let i = 0; i < 601; i++) add(data, `e${i}`, false);
    data.details.push({ ...data.details[0], seq: 1 }); data.exams[0].count = 2;
    add(data, 'ungraded'); add(data, 'kanji', true); data.exams.at(-1)!.mode = 'KANJI';
    const plan = planMigration(data);
    expect(plan.rows[0]).toMatchObject({ historyCount: 601, reviewCount: 5, excluded: true, blocked: false });
    expect(plan.rows[0].countedExamIds).toHaveLength(5);
    expect(plan.issues.some((i) => i.code === 'DUPLICATE_EXAM_QUESTION')).toBe(true);
  });
  it('uses consistent exams.results fallback and reports contradictory results', () => {
    const data = fixture(); add(data, 'fallback'); data.exams[0].results = [{ id: 'q', isCorrect: true }];
    expect(planMigration(data).rows[0]).toMatchObject({ reviewCount: 1, nextTime: '2026-04-01', blocked: false });
    data.details[0].isCorrect = false;
    expect(planMigration(data).rows[0].blocked).toBe(true);
  });
  it('restores old exclusion below 5 with the last result interval and keeps audit history', () => {
    const data = fixture(); add(data, 'e1', true); add(data, 'e2', true);
    data.histories.push({ id: 'h', subject: '1', questionId: 'q', mode: 'MATERIAL', status: 'EXCLUDED', correctCount: 2, nextTime: '2099-12-31', closedAt: '2026-01-01' });
    const plan = planMigration(data);
    expect(plan.rows[0]).toMatchObject({ reviewCount: 2, nextTime: '2026-04-01', excluded: false, blocked: false });
    expect(plan.summary.restore).toBe(1); expect(data.histories).toHaveLength(1);
  });
  it('does not infer zero for missing excluded history or apply around in-progress exams', () => {
    const data = fixture();
    data.histories.push({ id: 'h', subject: '1', questionId: 'q', mode: 'MATERIAL', status: 'EXCLUDED', correctCount: 2, nextTime: '2099-12-31', closedAt: '2026-01-01' });
    expect(planMigration(data).rows[0].blocked).toBe(true);
    add(data, 'e1', true); data.exams[0].status = 'IN_PROGRESS';
    expect(planMigration(data).globalBlock).toBe(true);
  });
  it('retains initialized counters when completed exams have since been deleted', () => {
    const data = fixture(); data.questions[0] = { ...data.questions[0], reviewCount: 1, reviewPolicyVersion: 2, countedExamIds: new Set(['deleted']) };
    const plan = planMigration(data);
    expect(plan.rows[0]).toMatchObject({ reviewCount: 1, alreadyMigrated: true, blocked: false });
    expect(plan.issues.some((i) => i.code === 'LEDGER_HISTORY_DIFFERENCE')).toBe(true);
  });
  it('reports duplicate candidates and never restores deleted masters', () => {
    const data = fixture(); add(data, 'e1', false); data.questions = [];
    expect(planMigration(data).issues.some((i) => i.code === 'DELETED_QUESTION_NOT_RESTORED')).toBe(true);
    expect(planMigration(data).rows).toHaveLength(0);
  });
  it('stops when an initialized ledger misses a surviving completed attempt', () => {
    const data = fixture(); add(data, 'missed', false);
    data.questions[0] = { ...data.questions[0], reviewCount: 1, reviewPolicyVersion: 2, countedExamIds: new Set(['other']) };
    const plan = planMigration(data);
    expect(plan.rows[0].blocked).toBe(true);
    expect(plan.issues.some((i) => i.code === 'UNCOUNTED_COMPLETED_HISTORY')).toBe(true);
  });
});
