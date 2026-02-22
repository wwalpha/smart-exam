import type { CreateExamRequest, Exam, SubjectId } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { ExamCandidateTable, KanjiTable } from '@/types/db';
import type { ExamTable } from '@/types/db';

import type { CandidateListParams, CreateExamDeps, ReviewCandidate } from './createExam.types';
import { ExamPdfService } from './examPdfService';
import { toApiExam } from './internal';

// 期限到来の候補を優先して出題対象にする。
const listDueCandidates = async (deps: CreateExamDeps, params: CandidateListParams): Promise<ExamCandidateTable[]> => {
  const today = params.todayYmd ?? DateUtils.todayYmd();
  return deps.repositories.examCandidates.listDueCandidates({
    subject: params.subject,
    mode: params.mode,
    todayYmd: today,
  });
};

// 同じ候補が複数テストで同時採用されないよう、採用時にロックする。
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

// ワークシート PDF を作成可能な漢字データだけを通す。
const isPrintableKanjiWorksheetWord = (word: KanjiTable): boolean => {
  return Boolean(
    String(word.question ?? '').trim() &&
    String(word.answer ?? '').trim() &&
    String(word.readingHiragana ?? '').trim() &&
    word.underlineSpec &&
    word.underlineSpec.type === 'promptSpan' &&
    Number.isInteger(word.underlineSpec.start) &&
    Number.isInteger(word.underlineSpec.length) &&
    word.underlineSpec.start >= 0 &&
    word.underlineSpec.length > 0,
  );
};

// 印刷可能と判定できた単語 ID を高速参照できる Set にまとめる。
const printableWordIds = (byId: Map<string, KanjiTable>): Set<string> => {
  return new Set(
    Array.from(byId.values())
      .filter((word) => isPrintableKanjiWorksheetWord(word))
      .map((word) => word.wordId),
  );
};

// 候補テーブル形式を試験作成で使う共通形式に正規化する。
const toKanjiExamCandidates = (sourceCandidates: ExamCandidateTable[], createdDate: string): ReviewCandidate[] => {
  return sourceCandidates
    .filter((candidate) => Boolean(candidate.nextTime))
    .map((candidate) => ({
      targetType: 'KANJI',
      targetId: candidate.questionId,
      subject: candidate.subject,
      registeredDate: createdDate,
      dueDate: candidate.nextTime,
      lastAttemptDate: candidate.createdAt,
      candidateKey: candidate.candidateKey,
    }));
};
export const buildKanjiCandidates = async (
  deps: CreateExamDeps,
  sourceCandidates: ExamCandidateTable[],
  createdDate: string,
): Promise<ReviewCandidate[]> => {
  const candidates = toKanjiExamCandidates(sourceCandidates, createdDate);
  if (candidates.length === 0) return candidates;

  // 候補に含まれる漢字の実体を取得して、印刷不可能なものを除外する。
  const ids = Array.from(new Set(candidates.map((candidate) => candidate.targetId)));
  const words = await Promise.all(ids.map((id) => deps.repositories.kanji.get(id)));
  const byId = new Map(
    words.filter((word): word is KanjiTable => word !== null).map((word) => [word.wordId, word] as const),
  );
  const printableIds = printableWordIds(byId);
  return candidates.filter((candidate) => printableIds.has(candidate.targetId));
};
export const createKanjiExam = async (deps: CreateExamDeps, req: CreateExamRequest): Promise<Exam> => {
  const examId = createUuid();
  const createdDate = DateUtils.todayYmd();

  // due 候補のみを対象にして、0件ならそのまま終了する。
  let sourceCandidates = await listDueCandidates(deps, { subject: req.subject, mode: req.mode });
  const candidates = await buildKanjiCandidates(deps, sourceCandidates, createdDate);

  // dueDate -> 最終解答日 -> targetId の順で安定ソートする。
  candidates.sort((a, b) => {
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
    if (a.lastAttemptDate !== b.lastAttemptDate) return a.lastAttemptDate < b.lastAttemptDate ? -1 : 1;
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
  const pdfS3Key = targetIds.length > 0 ? `exams/${examId}.pdf` : undefined;

  const testRow: ExamTable = {
    examId,
    subject: req.subject,
    mode: req.mode,
    status: 'IN_PROGRESS',
    count: selected.length,
    createdDate,
    ...(pdfS3Key ? { pdfS3Key } : {}),
    results: [],
  };
  await deps.repositories.exams.put(testRow);
  await deps.repositories.examDetails.putMany(examId, targetIds, req.mode);
  if (pdfS3Key) {
    try {
      if (!ENV.FILES_BUCKET_NAME) {
        throw new ApiError(
          'FILES_BUCKET_NAME is not configured',
          500,
          ['internal_server_error'],
          ['files_bucket_not_configured'],
        );
      }
      const detail = await deps.getExam(examId);
      if (!detail) {
        throw new Error('Review test detail not found after creation');
      }
      const pdfBuffer = await ExamPdfService.generatePdfBuffer(detail);
      await deps.repositories.s3.putObject({
        bucket: ENV.FILES_BUCKET_NAME,
        key: pdfS3Key,
        body: pdfBuffer,
        contentType: 'application/pdf',
      });
    } catch (error) {
      // PDF 生成または保存に失敗した場合は作成途中の試験データを巻き戻す。
      await deps.deleteExam(examId);
      throw error;
    }
  }
  return toApiExam(testRow) as Exam;
};
