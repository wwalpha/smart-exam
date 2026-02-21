import type { CreateExamRequest, Exam, SubjectId } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { ExamCandidateTable, KanjiTable } from '@/types/db';
import type { ExamTable } from '@/types/db';

import { computeKanjiQuestionFields } from '@/services/kanji/kanji.lib';

import type { CandidateListParams, CreateExamDeps, ReviewCandidate } from './createExam.types';
import { ExamPdfService } from './examPdfService';
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

// 内部で利用する処理を定義する
const isPrintableKanjiWorksheetWord = (word: KanjiTable): boolean => {
  // 処理結果を呼び出し元へ返す
  return Boolean(
    String(word.question ?? '').trim() &&
    String(word.answer ?? '').trim() &&
    String(word.readingHiragana ?? '').trim() &&
    word.underlineSpec &&
    // 値を代入する
    word.underlineSpec.type === 'promptSpan' &&
    Number.isInteger(word.underlineSpec.start) &&
    Number.isInteger(word.underlineSpec.length) &&
    word.underlineSpec.start >= 0 &&
    word.underlineSpec.length > 0,
  );
};

// 内部で利用する処理を定義する
const printableWordIds = (byId: Map<string, KanjiTable>): Set<string> => {
  // 処理結果を呼び出し元へ返す
  return new Set(
    Array.from(byId.values())
      .filter((word) => isPrintableKanjiWorksheetWord(word))
      .map((word) => word.wordId),
  );
};

// 内部で利用する処理を定義する
const toKanjiExamCandidates = (sourceCandidates: ExamCandidateTable[], createdDate: string): ReviewCandidate[] => {
  // 処理結果を呼び出し元へ返す
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

// 公開する処理を定義する
export const buildKanjiCandidates = async (
  deps: CreateExamDeps,
  sourceCandidates: ExamCandidateTable[],
  createdDate: string,
): Promise<ReviewCandidate[]> => {
  // 内部で利用する処理を定義する
  const candidates = toKanjiExamCandidates(sourceCandidates, createdDate);
  // 条件に応じて処理を分岐する
  if (candidates.length === 0) return candidates;

  // 内部で利用する処理を定義する
  const ids = Array.from(new Set(candidates.map((candidate) => candidate.targetId)));
  // 内部で利用する処理を定義する
  const words = await Promise.all(ids.map((id) => deps.repositories.kanji.get(id)));
  // 内部で利用する処理を定義する
  const byId = new Map(
    words.filter((word): word is KanjiTable => word !== null).map((word) => [word.wordId, word] as const),
  );

  // 処理で使う値を準備する
  let printableIds = printableWordIds(byId);
  // 条件に応じて処理を分岐する
  if (printableIds.size === 0 && byId.size > 0) {
    // 内部で利用する処理を定義する
    const toFill = Array.from(byId.values()).filter((word) => {
      // 条件に応じて処理を分岐する
      if (isPrintableKanjiWorksheetWord(word)) return false;
      // 処理結果を呼び出し元へ返す
      return Boolean(String(word.question ?? '').trim() && String(word.answer ?? '').trim());
    });

    // 条件に応じて処理を分岐する
    if (toFill.length > 0) {
      // 例外が発生しうる処理を実行する
      try {
        // 内部で利用する処理を定義する
        const bulk = await deps.repositories.bedrock.generateKanjiQuestionReadingsBulk({
          items: toFill.map((word) => ({
            id: word.wordId,
            question: String(word.question ?? ''),
            answer: String(word.answer ?? ''),
          })),
        });
        // 内部で利用する処理を定義する
        const generatedById = new Map(bulk.items.map((item) => [String(item.id ?? ''), item] as const));

        // 非同期処理の完了を待つ
        await Promise.all(
          toFill.map(async (word) => {
            // 内部で利用する処理を定義する
            const generated = generatedById.get(word.wordId);
            // 条件に応じて処理を分岐する
            if (!generated) return;

            // 内部で利用する処理を定義する
            const readingHiragana = String(generated.readingHiragana ?? '').trim();
            // 条件に応じて処理を分岐する
            if (!readingHiragana) return;

            // 例外が発生しうる処理を実行する
            try {
              // 内部で利用する処理を定義する
              const computed = computeKanjiQuestionFields({
                question: word.question,
                readingHiragana,
              });

              // 非同期処理の完了を待つ
              await deps.repositories.kanji.updateKanjiQuestionFields(word.wordId, {
                readingHiragana: computed.readingHiragana,
                underlineSpec: computed.underlineSpec,
              });

              byId.set(word.wordId, {
                ...word,
                readingHiragana: computed.readingHiragana,
                underlineSpec: computed.underlineSpec,
              });
            } catch {
              // 処理結果を呼び出し元へ返す
              return;
            }
          }),
        );

        // 値を代入する
        printableIds = printableWordIds(byId);
      } catch {
        // 自動補完に失敗しても候補絞り込みのみを継続する
      }
    }
  }

  // 処理結果を呼び出し元へ返す
  return candidates.filter((candidate) => printableIds.has(candidate.targetId));
};

// 公開する処理を定義する
export const createKanjiExam = async (deps: CreateExamDeps, req: CreateExamRequest): Promise<Exam> => {
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
  const candidates = await buildKanjiCandidates(deps, sourceCandidates, createdDate);

  candidates.sort((a, b) => {
    // 条件に応じて処理を分岐する
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
    // 条件に応じて処理を分岐する
    if (a.lastAttemptDate !== b.lastAttemptDate) return a.lastAttemptDate < b.lastAttemptDate ? -1 : 1;
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
  // 内部で利用する処理を定義する
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

  // 非同期処理の完了を待つ
  await deps.repositories.exams.put(testRow);
  await deps.repositories.examDetails.putMany(examId, targetIds, req.mode);

  // 条件に応じて処理を分岐する
  if (pdfS3Key) {
    // 例外が発生しうる処理を実行する
    try {
      // 条件に応じて処理を分岐する
      if (!ENV.FILES_BUCKET_NAME) {
        throw new ApiError(
          'FILES_BUCKET_NAME is not configured',
          500,
          ['internal_server_error'],
          ['files_bucket_not_configured'],
        );
      }

      // 内部で利用する処理を定義する
      const detail = await deps.getExam(examId);
      // 条件に応じて処理を分岐する
      if (!detail) {
        throw new Error('Review test detail not found after creation');
      }

      // 内部で利用する処理を定義する
      const pdfBuffer = await ExamPdfService.generatePdfBuffer(detail);
      // 非同期処理の完了を待つ
      await deps.repositories.s3.putObject({
        bucket: ENV.FILES_BUCKET_NAME,
        key: pdfS3Key,
        body: pdfBuffer,
        contentType: 'application/pdf',
      });
    } catch (error) {
      // 非同期処理の完了を待つ
      await deps.deleteExam(examId);
      throw error;
    }
  }

  // 処理結果を呼び出し元へ返す
  return toApiExam(testRow) as Exam;
};
