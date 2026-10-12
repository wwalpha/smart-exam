import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import { requireMaterialReviewCount } from '@/lib/materialReviewPolicy';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { get } from '@/repositories/materialQuestions/get';
import { listByExamId } from '@/repositories/examDetails/listByExamId';
import type { ExamCandidateTable, ExamTable } from '@/types/db';
import { completingExamCheck, type WriteItems } from './workflow';
import { listQuestionCandidates, materialExistsCheck } from './candidates';

export const processQuestion = async (exam: ExamTable, questionId: string): Promise<void> => {
  for (let attempt = 0; attempt < 8; attempt++) {
    const details = (await listByExamId(exam.examId)).filter((d) => d.targetId === questionId);
    if (details.length === 0) throw new ApiError('Missing exam detail', 409);
    if (details.every((d) => d.reviewProcessed)) return;
    const answers = new Set(details.filter((d) => typeof d.isCorrect === 'boolean').map((d) => d.isCorrect));
    const bodyAnswers = new Set((exam.results ?? []).filter((r) => r.id === questionId && typeof r.isCorrect === 'boolean').map((r) => r.isCorrect));
    if (answers.size > 1 || bodyAnswers.size > 1 || (answers.size && bodyAnswers.size && [...answers][0] !== [...bodyAnswers][0])) {
      throw new ApiError('Conflicting MATERIAL exam results', 409, ['conflicting_exam_results']);
    }
    const isCorrect = [...answers][0] ?? [...bodyAnswers][0];
    const question = await get(questionId);
    const candidates = await listQuestionCandidates(exam.subject, questionId);
    // Another completion may have committed between the detail and candidate reads.
    const refreshed = (await listByExamId(exam.examId)).filter((d) => d.targetId === questionId);
    if (refreshed.length && refreshed.every((d) => d.reviewProcessed)) return;
    if (candidates.some((c) => c.status === 'LOCKED' && c.examId !== exam.examId)) {
      throw new ApiError('Duplicate MATERIAL candidate locked by another exam', 409);
    }
    const count = question ? requireMaterialReviewCount(question) : 0;
    const ids = new Set(question?.countedExamIds ?? []);
    const increment = question && typeof isCorrect === 'boolean' && count < 5 && !ids.has(exam.examId);
    const nextCount = count + (increment ? 1 : 0);
    if (increment) ids.add(exam.examId);
    const currentCorrectCount = candidates.find((c) => c.examId === exam.examId)?.correctCount ?? 0;
    const computed = typeof isCorrect === 'boolean' ? ReviewNextTime.compute({ mode: 'MATERIAL', baseDateYmd: exam.submittedDate!, isCorrect, currentCorrectCount }) : null;
    const closedAt = DateUtils.now();
    const id = `material:${questionId}:${exam.examId}`;
    const nextCandidate: ExamCandidateTable | null = question && computed && nextCount < 5 ? {
      id, candidateKey: `${computed.nextTime}#${id}`, questionId, subject: question.subjectId, materialId: question.materialId,
      mode: 'MATERIAL', status: 'OPEN', correctCount: computed.nextCorrectCount, nextTime: computed.nextTime, createdAt: closedAt,
    } : null;
    const writes: WriteItems = [completingExamCheck(exam.examId)];
    if (question) {
      writes.push(materialExistsCheck(question.materialId), { Update: {
        TableName: ENV.TABLE_MATERIAL_QUESTIONS, Key: { questionId },
        ConditionExpression: 'reviewPolicyVersion = :version AND reviewCount = :oldCount AND ' +
          (question.reviewCandidateKey ? 'reviewCandidateKey = :oldKey' : 'attribute_not_exists(reviewCandidateKey)'),
        UpdateExpression: 'SET reviewCount = :count' + (ids.size ? ', countedExamIds = :ids' : '') +
          (nextCandidate ? ', reviewCandidateKey = :key' : ' REMOVE reviewCandidateKey'),
        ExpressionAttributeValues: { ':version': 2, ':oldCount': count, ':count': nextCount,
          ...(ids.size ? { ':ids': ids } : {}), ...(nextCandidate ? { ':key': nextCandidate.candidateKey } : {}),
          ...(question.reviewCandidateKey ? { ':oldKey': question.reviewCandidateKey } : {}),
        },
      } });
    } else {
      writes.push({ ConditionCheck: { TableName: ENV.TABLE_MATERIAL_QUESTIONS, Key: { questionId }, ConditionExpression: 'attribute_not_exists(questionId)' } });
    }
    for (const candidate of candidates) {
      writes.push({ Delete: {
        TableName: ENV.TABLE_EXAM_CANDIDATES, Key: { subject: candidate.subject, candidateKey: candidate.candidateKey },
        ConditionExpression: '#status = :status' + (candidate.examId ? ' AND examId = :examId' : ' AND attribute_not_exists(examId)'),
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': candidate.status, ...(candidate.examId ? { ':examId': candidate.examId } : {}) },
      } });
      writes.push({ Put: { TableName: ENV.TABLE_EXAM_HISTORIES, Item: {
        id: candidate.id, subject: candidate.subject, questionId, mode: 'MATERIAL', status: 'CLOSED',
        correctCount: candidate.correctCount, nextTime: candidate.nextTime, closedAt,
      } } });
    }
    if (!candidates.length) writes.push({ Put: { TableName: ENV.TABLE_EXAM_HISTORIES, Item: {
      id: `${id}:closed`, subject: exam.subject, questionId, mode: 'MATERIAL', status: 'CLOSED',
      correctCount: currentCorrectCount, nextTime: exam.submittedDate, closedAt,
    } } });
    if (nextCandidate) writes.push({ Put: { TableName: ENV.TABLE_EXAM_CANDIDATES, Item: nextCandidate } });
    if (increment && nextCount === 5) writes.push({ Put: { TableName: ENV.TABLE_EXAM_HISTORIES, Item: {
      id: `${id}:excluded`, subject: exam.subject, questionId, mode: 'MATERIAL', status: 'EXCLUDED',
      correctCount: computed!.nextCorrectCount, nextTime: ReviewNextTime.EXCLUDED_NEXT_TIME, closedAt,
    } } });
    for (const detail of details) writes.push({ Update: {
      TableName: ENV.TABLE_EXAM_DETAILS, Key: { examId: exam.examId, seq: detail.seq },
      ConditionExpression: 'targetId = :id AND attribute_not_exists(reviewProcessed)',
      UpdateExpression: 'SET reviewProcessed = :yes', ExpressionAttributeValues: { ':id': questionId, ':yes': true },
    } });
    if (writes.length > 100) throw new ApiError('Too many duplicate candidates/details; migration repair required', 409);
    try {
      await dbHelper.transactWrite({ TransactItems: writes });
      return;
    } catch (error) {
      if ((error as Error).name !== 'TransactionCanceledException' || attempt === 7) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
    }
  }
};
