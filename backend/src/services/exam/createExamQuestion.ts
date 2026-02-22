import type { CreateExamRequest, Exam, SubjectId } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import type { ExamCandidateTable, ExamTable } from '@/types/db';

import type { CandidateListParams, CreateExamDeps, ReviewCandidate } from './createExam.types';
import { toApiExam } from './internal';

// 期限到来の候補を優先して取得する。
const listDueCandidates = async (deps: CreateExamDeps, params: CandidateListParams): Promise<ExamCandidateTable[]> => {
  const today = params.todayYmd ?? DateUtils.todayYmd();
  return deps.repositories.examCandidates.listDueCandidates({
    subject: params.subject,
    mode: params.mode,
    todayYmd: today,
  });
};

// 採用時点で候補をロックして重複出題を防ぐ。
const lockCandidate = async (
  deps: CreateExamDeps,
  params: { subject: SubjectId; candidateKey: string; examId: string },
): Promise<boolean> => {
  return deps.repositories.examCandidates.lockCandidateIfUnlocked({
    subject: params.subject,
    candidateKey: params.candidateKey,
    examId: params.examId,
    status: 'LOCKED',
  });
};
export const buildQuestionCandidates = (
  sourceCandidates: ExamCandidateTable[],
  createdDate: string,
): ReviewCandidate[] => {
  // 作成日より未来の nextTime は出題対象外にして、先取り出題を防止する。
  return sourceCandidates
    .filter((candidate) => Boolean(candidate.nextTime) && String(candidate.nextTime) <= createdDate)
    .map((candidate) => ({
      targetType: 'MATERIAL',
      targetId: candidate.questionId,
      subject: candidate.subject,
      registeredDate: createdDate,
      dueDate: candidate.nextTime,
      lastAttemptDate: '',
      candidateKey: candidate.candidateKey,
    }));
};
export const createQuestionExam = async (deps: CreateExamDeps, req: CreateExamRequest): Promise<Exam> => {
  const examId = createUuid();
  const createdDate = DateUtils.todayYmd();

  // due 候補のみを対象にして、0件ならそのまま終了する。
  let sourceCandidates = await listDueCandidates(deps, { subject: req.subject, mode: req.mode });
  const candidates = buildQuestionCandidates(sourceCandidates, createdDate);

  // dueDate と targetId で出題順を固定する。
  candidates.sort((a, b) => {
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
    if (a.targetId !== b.targetId) return a.targetId < b.targetId ? -1 : 1;
    return 0;
  });

  const selected: ReviewCandidate[] = [];
  for (const candidate of candidates) {
    if (selected.length >= req.count) break;
    if (!candidate.dueDate) continue;
    if (candidate.candidateKey) {
      const locked = await lockCandidate(deps, {
        subject: candidate.subject,
        candidateKey: candidate.candidateKey,
        examId,
      });
      if (!locked) continue;
    }
    selected.push(candidate);
  }
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
  await deps.repositories.exams.put(testRow);
  await deps.repositories.examDetails.putMany(examId, targetIds, req.mode);
  return toApiExam(testRow) as Exam;
};
