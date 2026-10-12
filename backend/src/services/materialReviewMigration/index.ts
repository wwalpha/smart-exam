import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { DateUtils } from '@/lib/dateUtils';
import { requireMaterialReviewCount } from '@/lib/materialReviewPolicy';
import type { ExamTable, ExamDetailTable, MaterialQuestionsTable, ExamCandidateTable, ExamHistoryTable, MaterialTable } from '@/types/db';
import type { WriteItems } from '@/repositories/materialReviews/workflow';
import { syncMaterialOpenCandidateCount } from '@/repositories/examCandidates/syncMaterialOpenCandidateCount';

export type Snapshot = {
  exams: ExamTable[]; details: ExamDetailTable[]; questions: MaterialQuestionsTable[];
  candidates: ExamCandidateTable[]; histories: ExamHistoryTable[]; materials: MaterialTable[];
};
type Issue = { code: string; questionId?: string; examId?: string };
export type MigrationRow = {
  questionId: string; beforeCount?: number; historyCount: number; reviewCount: number;
  countedExamIds: string[]; excluded: boolean; alreadyMigrated: boolean;
  nextTime?: string; candidate?: ExamCandidateTable; blocked: boolean;
  correctCount: number;
};

export const readSnapshot = async (): Promise<Snapshot> => {
  const [exams, details, questions, candidates, histories, materials] = await Promise.all([
    dbHelper.scan<ExamTable>({ TableName: ENV.TABLE_EXAMS, ConsistentRead: true }),
    dbHelper.scan<ExamDetailTable>({ TableName: ENV.TABLE_EXAM_DETAILS, ConsistentRead: true }),
    dbHelper.scan<MaterialQuestionsTable>({ TableName: ENV.TABLE_MATERIAL_QUESTIONS, ConsistentRead: true }),
    dbHelper.scan<ExamCandidateTable>({ TableName: ENV.TABLE_EXAM_CANDIDATES, ConsistentRead: true }),
    dbHelper.scan<ExamHistoryTable>({ TableName: ENV.TABLE_EXAM_HISTORIES, ConsistentRead: true }),
    dbHelper.scan<MaterialTable>({ TableName: ENV.TABLE_MATERIALS, ConsistentRead: true }),
  ]);
  return { exams: exams.Items, details: details.Items, questions: questions.Items, candidates: candidates.Items, histories: histories.Items, materials: materials.Items };
};

export const planMigration = (data: Snapshot) => {
  const issues: Issue[] = [];
  const blocked = new Set<string>();
  const attempts = new Map<string, Array<{ examId: string; date: string; isCorrect: boolean }>>();
  const exams = new Map(data.exams.map((e) => [e.examId, e]));
  const detailsByExam = new Map<string, ExamDetailTable[]>();
  for (const detail of data.details) {
    const list = detailsByExam.get(detail.examId) ?? [];
    list.push(detail); detailsByExam.set(detail.examId, list);
    if (!exams.has(detail.examId) && detail.targetType === 'MATERIAL') {
      issues.push({ code: 'MISSING_EXAM', questionId: detail.targetId, examId: detail.examId });
      blocked.add(detail.targetId);
    }
  }
  let globalBlock = false;
  for (const exam of data.exams.filter((e) => e.mode === 'MATERIAL')) {
    if (exam.status !== 'COMPLETED') {
      issues.push({ code: 'IN_PROGRESS_EXAM', examId: exam.examId });
      globalBlock = true; continue;
    }
    const details = detailsByExam.get(exam.examId) ?? [];
    if (details.length !== exam.count) {
      issues.push({ code: 'MISSING_OR_DUPLICATE_DETAILS', examId: exam.examId });
      globalBlock = true;
    }
    const targetIds = new Set(details.map((d) => d.targetId));
    for (const result of exam.results ?? []) {
      if (!targetIds.has(result.id)) {
        issues.push({ code: 'RESULT_WITHOUT_DETAIL', questionId: result.id, examId: exam.examId });
        blocked.add(result.id);
      }
    }
    for (const questionId of targetIds) {
      const rows = details.filter((d) => d.targetId === questionId);
      if (rows.length > 1) issues.push({ code: 'DUPLICATE_EXAM_QUESTION', questionId, examId: exam.examId });
      const detailAnswers = new Set(rows.filter((d) => typeof d.isCorrect === 'boolean').map((d) => d.isCorrect as boolean));
      const results = (exam.results ?? []).filter((r) => r.id === questionId);
      const bodyAnswers = new Set(results.filter((r) => typeof r.isCorrect === 'boolean').map((r) => r.isCorrect));
      if (rows.some((d) => d.targetType !== 'MATERIAL') || detailAnswers.size > 1 || bodyAnswers.size > 1 ||
          (detailAnswers.size && bodyAnswers.size && [...detailAnswers][0] !== [...bodyAnswers][0])) {
        issues.push({ code: 'CONFLICTING_RESULTS', questionId, examId: exam.examId }); blocked.add(questionId); continue;
      }
      const isCorrect = [...detailAnswers][0] ?? [...bodyAnswers][0];
      if (typeof isCorrect !== 'boolean') {
        issues.push({ code: 'UNGRADED_DETAIL', questionId, examId: exam.examId }); continue;
      }
      if (!detailAnswers.size) issues.push({ code: 'RESULTS_FALLBACK', questionId, examId: exam.examId });
      const date = exam.submittedDate ?? exam.createdDate;
      if (!DateUtils.isValidYmd(date)) {
        issues.push({ code: 'INVALID_ATTEMPT_DATE', questionId, examId: exam.examId }); blocked.add(questionId); continue;
      }
      const list = attempts.get(questionId) ?? [];
      list.push({ examId: exam.examId, date, isCorrect }); attempts.set(questionId, list);
    }
  }
  const rows: MigrationRow[] = data.questions.map((question) => {
    const history = (attempts.get(question.questionId) ?? []).sort((a, b) => a.date.localeCompare(b.date) || a.examId.localeCompare(b.examId));
    const latest = history.at(-1);
    const candidates = data.candidates.filter((c) => c.mode === 'MATERIAL' && c.questionId === question.questionId);
    const oldExcluded = data.histories.some((h) => h.mode === 'MATERIAL' && h.questionId === question.questionId && h.status === 'EXCLUDED');
    const hasHistory = data.histories.some((h) => h.mode === 'MATERIAL' && h.questionId === question.questionId);
    if (!history.length && (hasHistory || candidates.some((c) => c.correctCount > 0)) && question.reviewPolicyVersion !== 2) {
      issues.push({ code: 'INSUFFICIENT_REVIEW_HISTORY', questionId: question.questionId }); blocked.add(question.questionId);
    }
    if (latest && history.some((h) => h.date === latest.date && h.isCorrect !== latest.isCorrect)) {
      issues.push({ code: 'AMBIGUOUS_LAST_RESULT', questionId: question.questionId }); blocked.add(question.questionId);
    }
    if (candidates.length > 1) {
      issues.push({ code: 'DUPLICATE_CANDIDATES', questionId: question.questionId }); blocked.add(question.questionId);
    }
    if (candidates.some((c) => c.status !== 'OPEN' || c.subject !== question.subjectId || c.materialId !== question.materialId)) {
      issues.push({ code: 'INVALID_OR_LOCKED_CANDIDATE', questionId: question.questionId }); blocked.add(question.questionId);
    }
    if (oldExcluded && history.length < 2 && question.reviewPolicyVersion !== 2) {
      issues.push({ code: 'INSUFFICIENT_EXCLUDED_HISTORY', questionId: question.questionId }); blocked.add(question.questionId);
    }
    if (!data.materials.some((m) => m.materialId === question.materialId)) {
      issues.push({ code: 'MISSING_MATERIAL', questionId: question.questionId }); blocked.add(question.questionId);
    }
    let count = Math.min(5, history.length);
    let countedExamIds = history.slice(0, 5).map((h) => h.examId);
    const alreadyMigrated = question.reviewPolicyVersion === 2;
    if (alreadyMigrated) {
      try {
        count = requireMaterialReviewCount(question); countedExamIds = [...question.countedExamIds ?? []];
        if (Math.min(5, history.length) !== count) issues.push({ code: 'LEDGER_HISTORY_DIFFERENCE', questionId: question.questionId });
        if (count < 5 && history.some((h) => !countedExamIds.includes(h.examId))) {
          issues.push({ code: 'UNCOUNTED_COMPLETED_HISTORY', questionId: question.questionId }); blocked.add(question.questionId);
        }
      } catch {
        issues.push({ code: 'INVALID_EXISTING_COUNTER', questionId: question.questionId }); blocked.add(question.questionId);
      }
    } else if (question.reviewCount !== undefined || question.countedExamIds !== undefined || question.reviewPolicyVersion !== undefined) {
      issues.push({ code: 'PARTIAL_OR_UNKNOWN_POLICY', questionId: question.questionId }); blocked.add(question.questionId);
    }
    const nextTime = latest ? ReviewNextTime.compute({ mode: 'MATERIAL', baseDateYmd: latest.date, isCorrect: latest.isCorrect, currentCorrectCount: 0 }).nextTime : undefined;
    let correctCount = 0;
    for (let i = history.length - 1; i >= 0 && history[i].isCorrect; i--) correctCount++;
    return {
      questionId: question.questionId, beforeCount: question.reviewCount, historyCount: history.length, reviewCount: count,
      countedExamIds, excluded: count >= 5, alreadyMigrated, nextTime, candidate: candidates[0],
      correctCount: history.length ? correctCount : candidates[0]?.correctCount ?? 0,
      blocked: globalBlock || blocked.has(question.questionId),
    };
  });
  for (const questionId of attempts.keys()) if (!data.questions.some((q) => q.questionId === questionId)) issues.push({ code: 'DELETED_QUESTION_NOT_RESTORED', questionId });
  return { rows, issues, globalBlock, summary: {
    questions: rows.length, initialize: rows.filter((r) => !r.alreadyMigrated && !r.blocked).length,
    excluded: rows.filter((r) => r.excluded).length,
    restore: rows.filter((r) => !r.alreadyMigrated && !r.excluded && r.reviewCount > 0 && !r.candidate && !r.blocked).length,
    blocked: rows.filter((r) => r.blocked).length,
  } };
};

export const applyMigration = async (data: Snapshot, plan: ReturnType<typeof planMigration>): Promise<number> => {
  if (plan.globalBlock || plan.rows.some((r) => r.blocked)) throw new Error('Migration blocked; resolve reported inconsistencies before apply');
  let processed = 0;
  for (const row of plan.rows) {
    if (row.alreadyMigrated) continue;
    const question = data.questions.find((q) => q.questionId === row.questionId)!;
    const nextTime = row.nextTime ?? row.candidate?.nextTime;
    const id = row.candidate?.id ?? `material:migration:${row.questionId}`;
    const candidate: ExamCandidateTable | undefined = !row.excluded && nextTime ? {
      ...(row.candidate ?? {}), id, candidateKey: `${nextTime}#${id}`, subject: question.subjectId,
      questionId: row.questionId, materialId: question.materialId, mode: 'MATERIAL', status: 'OPEN',
      correctCount: row.correctCount, nextTime, createdAt: row.candidate?.createdAt ?? new Date().toISOString(),
    } : undefined;
    const writes: WriteItems = [
      { ConditionCheck: { TableName: ENV.TABLE_MATERIALS, Key: { materialId: question.materialId }, ConditionExpression: 'attribute_exists(materialId)' } },
      { Update: {
        TableName: ENV.TABLE_MATERIAL_QUESTIONS, Key: { questionId: row.questionId },
        ConditionExpression: 'attribute_exists(questionId) AND attribute_not_exists(reviewPolicyVersion) AND attribute_not_exists(reviewCount) AND attribute_not_exists(countedExamIds)',
        UpdateExpression: 'SET reviewPolicyVersion = :version, reviewCount = :count' + (row.countedExamIds.length ? ', countedExamIds = :ids' : '') + (candidate ? ', reviewCandidateKey = :key' : ' REMOVE reviewCandidateKey'),
        ExpressionAttributeValues: { ':version': 2, ':count': row.reviewCount,
          ...(row.countedExamIds.length ? { ':ids': new Set(row.countedExamIds) } : {}), ...(candidate ? { ':key': candidate.candidateKey } : {}),
        },
      } },
    ];
    if (row.candidate && row.candidate.candidateKey !== candidate?.candidateKey) writes.push({ Delete: {
      TableName: ENV.TABLE_EXAM_CANDIDATES, Key: { subject: row.candidate.subject, candidateKey: row.candidate.candidateKey },
      ConditionExpression: '#status = :open AND attribute_not_exists(examId)', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':open': 'OPEN' },
    } });
    if (candidate) writes.push({ Put: { TableName: ENV.TABLE_EXAM_CANDIDATES, Item: candidate,
      ...(row.candidate?.candidateKey === candidate.candidateKey ? {
        ConditionExpression: '#status = :open AND attribute_not_exists(examId)', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':open': 'OPEN' },
      } : { ConditionExpression: 'attribute_not_exists(candidateKey)' }),
    } });
    await dbHelper.transactWrite({ TransactItems: writes });
    processed++;
  }
  for (const materialId of new Set(data.questions.map((q) => q.materialId))) await syncMaterialOpenCandidateCount(materialId);
  return processed;
};

export const verifyMigration = (data: Snapshot) => {
  const violations: Issue[] = [];
  for (const question of data.questions) {
    try {
      const count = requireMaterialReviewCount(question);
      const candidates = data.candidates.filter((c) => c.mode === 'MATERIAL' && c.questionId === question.questionId);
      if (count === 5 && candidates.length) violations.push({ code: 'EXCLUDED_HAS_CANDIDATE', questionId: question.questionId });
      if (candidates.length > 1 || (candidates.length === 1 && candidates[0].candidateKey !== question.reviewCandidateKey)) violations.push({ code: 'CANDIDATE_POINTER_MISMATCH', questionId: question.questionId });
    } catch { violations.push({ code: 'INVALID_COUNTER', questionId: question.questionId }); }
  }
  return violations;
};
