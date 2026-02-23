import type { CreateExamRequest, Exam, SubjectId } from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { createUuid } from '@/lib/uuid';
import type { ExamCandidateTable, ExamTable } from '@/types/db';

import type { CandidateListParams, CreateExamDeps, ExamCandidate } from './createExam.types';
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
): ExamCandidate[] => {
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
      materialId: candidate.materialId,
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

  const lockResults = await Promise.all(
    candidates.map(async (candidate, index) => {
      if (!candidate.dueDate) {
        return { candidate, index, locked: false, selectable: false };
      }
      if (!candidate.candidateKey) {
        return { candidate, index, locked: false, selectable: true };
      }

      const locked = await lockCandidate(deps, {
        subject: candidate.subject,
        candidateKey: candidate.candidateKey,
        examId,
      });

      return { candidate, index, locked, selectable: locked };
    }),
  );

  const selectedResultIndices = new Set(
    lockResults
      .filter((result) => result.selectable)
      .slice(0, req.count)
      .map((result) => result.index),
  );

  const selected: ExamCandidate[] = lockResults
    .filter((result) => selectedResultIndices.has(result.index))
    .map((result) => result.candidate);

  const lockedButUnselected = lockResults.filter(
    (result) => result.locked && !selectedResultIndices.has(result.index) && Boolean(result.candidate.candidateKey),
  );

  await Promise.all(
    lockedButUnselected.map((result) =>
      deps.repositories.examCandidates.releaseLockIfMatch({
        subject: result.candidate.subject,
        candidateKey: result.candidate.candidateKey as string,
        examId,
      }),
    ),
  );

  const materialIdsToSync = new Set(
    lockResults
      .filter((result) => result.locked && Boolean(result.candidate.materialId))
      .map((result) => result.candidate.materialId as string),
  );

  // 候補の採用処理が完了してから教材側件数を一括で追随させる。
  await Promise.all(
    Array.from(materialIdsToSync).map((materialId) =>
      deps.repositories.examCandidates.syncMaterialOpenCandidateCount(materialId),
    ),
  );

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
