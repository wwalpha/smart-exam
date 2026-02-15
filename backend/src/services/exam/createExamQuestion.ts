import type { CreateExamRequest, Exam, SubjectId } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import type { ExamCandidateTable, ExamTable } from '@/types/db';

import type { CandidateListParams, CreateExamDeps, ReviewCandidate } from './createExam.types';
import { toApiExam } from './internal';

// 内部で利用する処理を定義する
const listDueCandidates = async (deps: CreateExamDeps, params: CandidateListParams): Promise<ExamCandidateTable[]> => {
  // 内部で利用する処理を定義する
  const today = params.todayYmd ?? DateUtils.todayYmd();

  // 処理結果を呼び出し元へ返す
  return deps.repositories.examCandidates.listDueCandidates({
    subject: params.subject,
    mode: params.mode,
    todayYmd: today,
  });
};

// 内部で利用する処理を定義する
const listOpenCandidates = async (deps: CreateExamDeps, params: CandidateListParams): Promise<ExamCandidateTable[]> => {
  // 処理結果を呼び出し元へ返す
  return deps.repositories.examCandidates.listCandidates({
    subject: params.subject,
    mode: params.mode,
  });
};

// 内部で利用する処理を定義する
const lockCandidate = async (
  deps: CreateExamDeps,
  params: { subject: SubjectId; candidateKey: string; examId: string },
): Promise<void> => {
  // 非同期処理の完了を待つ
  await deps.repositories.examCandidates.lockCandidateIfUnlocked({
    subject: params.subject,
    candidateKey: params.candidateKey,
    examId: params.examId,
    status: 'LOCKED',
  });
};

// 公開する処理を定義する
export const buildQuestionCandidates = (
  sourceCandidates: ExamCandidateTable[],
  createdDate: string,
): ReviewCandidate[] => {
  // 処理結果を呼び出し元へ返す
  return sourceCandidates
    .filter((candidate) => Boolean(candidate.nextTime))
    .map((candidate) => ({
      targetType: 'QUESTION',
      targetId: candidate.questionId,
      subject: candidate.subject,
      registeredDate: createdDate,
      dueDate: candidate.nextTime,
      lastAttemptDate: '',
      candidateKey: candidate.candidateKey,
    }));
};

// 公開する処理を定義する
export const createQuestionExam = async (deps: CreateExamDeps, req: CreateExamRequest): Promise<Exam> => {
  // 内部で利用する処理を定義する
  const examId = createUuid();
  // 内部で利用する処理を定義する
  const createdDate = DateUtils.todayYmd();

  // 非同期で必要な値を取得する
  let sourceCandidates = await listDueCandidates(deps, { subject: req.subject, mode: req.mode });
  // 条件に応じて処理を分岐する
  if (sourceCandidates.length === 0) {
    // 値を代入する
    sourceCandidates = await listOpenCandidates(deps, { subject: req.subject, mode: req.mode });
  }

  // 内部で利用する処理を定義する
  const candidates = buildQuestionCandidates(sourceCandidates, createdDate);

  candidates.sort((a, b) => {
    // 条件に応じて処理を分岐する
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
    // 条件に応じて処理を分岐する
    if (a.targetId !== b.targetId) return a.targetId < b.targetId ? -1 : 1;
    // 処理結果を呼び出し元へ返す
    return 0;
  });

  const selected: ReviewCandidate[] = [];
  // 対象データを順番に処理する
  for (const candidate of candidates) {
    // 条件に応じて処理を分岐する
    if (selected.length >= req.count) break;
    // 条件に応じて処理を分岐する
    if (!candidate.dueDate) continue;

    // 例外が発生しうる処理を実行する
    try {
      // 条件に応じて処理を分岐する
      if (candidate.candidateKey) {
        // 非同期処理の完了を待つ
        await lockCandidate(deps, {
          subject: candidate.subject,
          candidateKey: candidate.candidateKey,
          examId,
        });
      }
      selected.push(candidate);
    } catch (error: unknown) {
      // 内部で利用する処理を定義する
      const name = (error as { name?: string } | null)?.name;
      // 条件に応じて処理を分岐する
      if (name === 'ConditionalCheckFailedException') continue;
      throw error;
    }
  }

  // 内部で利用する処理を定義する
  const targetIds = selected.map((candidate) => candidate.targetId);
  const testRow: ExamTable = {
    examId,
    subject: req.subject,
    mode: req.mode,
    status: 'IN_PROGRESS',
    count: selected.length,
    createdDate,
    results: [],
  };

  // 非同期処理の完了を待つ
  await deps.repositories.exams.put(testRow);
  await deps.repositories.examDetails.putMany(examId, targetIds);

  // 処理結果を呼び出し元へ返す
  return toApiExam(testRow) as Exam;
};
