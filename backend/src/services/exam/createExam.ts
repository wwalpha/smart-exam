import type { ReviewMode, Exam, SubjectId } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, ExamTable, WordMasterTable } from '@/types/db';

import { computeKanjiQuestionFields } from '@/services/kanji/computeKanjiQuestionFields';

import type { ExamsService } from './createExamsService';
import { toApiExam } from './internal';
import { ExamPdfService } from './examPdfService';

type ReviewCandidate = {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
  subject: SubjectId;
  registeredDate: string;
  dueDate: string | null;
  lastAttemptDate: string;
  candidateKey?: string;
};

type CreateExamDeps = {
  repositories: Repositories;
  getExam: ExamsService['getExam'];
  deleteExam: ExamsService['deleteExam'];
};

// 内部で利用する補助処理を定義する
const isPrintableKanjiWorksheetWord = (w: WordMasterTable): boolean => {
  // 処理結果を呼び出し元へ返す
  return Boolean(
    String(w.question ?? '').trim() &&
    String(w.answer ?? '').trim() &&
    String(w.readingHiragana ?? '').trim() &&
    w.underlineSpec &&
    w.underlineSpec.type === 'promptSpan' &&
    Number.isInteger(w.underlineSpec.start) &&
    Number.isInteger(w.underlineSpec.length) &&
    w.underlineSpec.start >= 0 &&
    w.underlineSpec.length > 0,
  );
};

// 内部で利用する補助処理を定義する
const printableWordIds = (byId: Map<string, WordMasterTable>): Set<string> => {
  // 処理結果を呼び出し元へ返す
  return new Set(
    Array.from(byId.values())
      .filter((w) => isPrintableKanjiWorksheetWord(w))
      .map((w) => w.wordId),
  );
};

// 内部で利用する補助処理を定義する
const listDueCandidates = async (
  deps: CreateExamDeps,
  params: {
    subject: SubjectId;
    mode?: ReviewMode;
    todayYmd?: string;
  },
): Promise<ExamCandidateTable[]> => {
  // 処理で使う値を準備する
  const today = params.todayYmd ?? DateUtils.todayYmd();

  // 処理結果を呼び出し元へ返す
  return deps.repositories.examCandidates.listDueCandidates({
    subject: params.subject,
    mode: params.mode,
    todayYmd: today,
  });
};

// 内部で利用する補助処理を定義する
const listOpenCandidates = async (
  deps: CreateExamDeps,
  params: {
    subject: SubjectId;
    mode?: ReviewMode;
  },
): Promise<ExamCandidateTable[]> => {
  // 処理結果を呼び出し元へ返す
  return deps.repositories.examCandidates.listCandidates({
    subject: params.subject,
    mode: params.mode,
  });
};

// 内部で利用する補助処理を定義する
const lockCandidate = async (
  deps: CreateExamDeps,
  params: { subject: SubjectId; candidateKey: string; testId: string },
): Promise<void> => {
  // 非同期処理の完了を待つ
  await deps.repositories.examCandidates.lockCandidateIfUnlocked({
    subject: params.subject,
    candidateKey: params.candidateKey,
    testId: params.testId,
    status: 'LOCKED',
  });
};

// 内部で利用する補助処理を定義する
const createExamImpl = async (deps: CreateExamDeps, req: Parameters<ExamsService['createExam']>[0]): Promise<Exam> => {
  // 処理で使う値を準備する
  const testId = createUuid();
  // 処理で使う値を準備する
  const createdDate = DateUtils.todayYmd();

  const candidates: ReviewCandidate[] = [];

  // 候補テーブルから取得する (要件: Master全スキャンではなく候補テーブルを使用)
  let sourceCandidates = await listDueCandidates(deps, { subject: req.subject, mode: req.mode });

  // 期限到来候補が0件でも、OPEN在庫があれば作成できるようにフォールバックする
  if (sourceCandidates.length === 0) {
    sourceCandidates = await listOpenCandidates(deps, { subject: req.subject, mode: req.mode });
  }

  // 対象データを順番に処理する
  for (const c of sourceCandidates) {
    // 条件に応じて処理を分岐する
    if (!c.nextTime) continue;
    candidates.push({
      targetType: req.mode,
      targetId: c.questionId,
      subject: c.subject,
      registeredDate: createdDate,
      dueDate: c.nextTime,
      lastAttemptDate: req.mode === 'KANJI' ? c.createdAt : '',
      candidateKey: c.candidateKey,
    });
  }

  // KANJI worksheet は印刷に必要なフィールドが揃っているもののみを対象にする
  if (req.mode === 'KANJI' && candidates.length > 0) {
    // 処理で使う値を準備する
    const ids = Array.from(new Set(candidates.map((c) => c.targetId)));
    // 非同期で必要な値を取得する
    const words = await Promise.all(ids.map((id) => deps.repositories.wordMaster.get(id)));
    // 処理で使う値を準備する
    const byId = new Map(words.filter((w): w is WordMasterTable => w !== null).map((w) => [w.wordId, w] as const));

    // 後続処理で更新する値を初期化する
    let printableIds = printableWordIds(byId);

    // 既存データに不足フィールドがあると 0 件になりやすいので、全滅時のみ自動補完を試みる
    if (printableIds.size === 0 && byId.size > 0) {
      // 処理で使う値を準備する
      const toFill = Array.from(byId.values()).filter((w) => {
        // 条件に応じて処理を分岐する
        if (isPrintableKanjiWorksheetWord(w)) return false;
        // 処理結果を呼び出し元へ返す
        return Boolean(String(w.question ?? '').trim() && String(w.answer ?? '').trim());
      });

      // 条件に応じて処理を分岐する
      if (toFill.length > 0) {
        // 例外が発生しうる処理を実行する
        try {
          // 非同期で必要な値を取得する
          const bulk = await deps.repositories.bedrock.generateKanjiQuestionReadingsBulk({
            items: toFill.map((w) => ({
              id: w.wordId,
              question: String(w.question ?? ''),
              answer: String(w.answer ?? ''),
            })),
          });
          // 処理で使う値を準備する
          const generatedById = new Map(bulk.items.map((x) => [String(x.id ?? ''), x] as const));

          // 非同期処理の完了を待つ
          await Promise.all(
            toFill.map(async (w) => {
              // 処理で使う値を準備する
              const generated = generatedById.get(w.wordId);
              // 条件に応じて処理を分岐する
              if (!generated) return;

              // 処理で使う値を準備する
              const readingHiragana = String(generated.readingHiragana ?? '').trim();
              // 条件に応じて処理を分岐する
              if (!readingHiragana) return;

              // 例外が発生しうる処理を実行する
              try {
                // 処理で使う値を準備する
                const computed = computeKanjiQuestionFields({
                  question: w.question,
                  readingHiragana,
                });

                // 非同期処理の完了を待つ
                await deps.repositories.wordMaster.updateKanjiQuestionFields(w.wordId, {
                  readingHiragana: computed.readingHiragana,
                  underlineSpec: computed.underlineSpec,
                });

                byId.set(w.wordId, {
                  ...w,
                  readingHiragana: computed.readingHiragana,
                  underlineSpec: computed.underlineSpec,
                });
              } catch {
                // Bedrock結果が本文の部分文字列にならない等は印刷対象外のままにする
                return;
              }
            }),
          );

          printableIds = printableWordIds(byId);
        } catch {
          // 自動補完に失敗しても、ここでは候補の絞り込みだけ行い、最終的に 0 件なら従来通り 400
        }
      }
    }

    // 処理で使う値を準備する
    const filtered = candidates.filter((c) => printableIds.has(c.targetId));
    candidates.length = 0;
    candidates.push(...filtered);
  }

  // 要件 8.3: dueDate asc -> lastAttemptDate asc -> ID asc (deterministic)
  candidates.sort((a, b) => {
    // 条件に応じて処理を分岐する
    if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
    // 条件に応じて処理を分岐する
    if (a.lastAttemptDate !== b.lastAttemptDate) return a.lastAttemptDate < b.lastAttemptDate ? -1 : 1;
    // 条件に応じて処理を分岐する
    if (a.targetId !== b.targetId) return a.targetId < b.targetId ? -1 : 1;
    // 処理結果を呼び出し元へ返す
    return a.targetType < b.targetType ? -1 : a.targetType > b.targetType ? 1 : 0;
  });

  const selected: ReviewCandidate[] = [];
  // 対象データを順番に処理する
  for (const c of candidates) {
    // 条件に応じて処理を分岐する
    if (selected.length >= req.count) break;
    // 条件に応じて処理を分岐する
    if (!c.dueDate) continue;

    // 例外が発生しうる処理を実行する
    try {
      // 条件に応じて処理を分岐する
      if (c.candidateKey) {
        // 非同期処理の完了を待つ
        await lockCandidate(deps, { subject: c.subject, candidateKey: c.candidateKey, testId });
      }
      selected.push(c);
    } catch (e: unknown) {
      // 処理で使う値を準備する
      const name = (e as { name?: string } | null)?.name;
      // 条件に応じて処理を分岐する
      if (name === 'ConditionalCheckFailedException') continue;
      throw e;
    }
  }

  // 処理で使う値を準備する
  const targetIds = selected.map((c) => c.targetId);
  // 処理で使う値を準備する
  const hasKanjiTargets = req.mode === 'KANJI' && targetIds.length > 0;
  // 処理で使う値を準備する
  const pdfS3Key = hasKanjiTargets ? `review-tests/${testId}.pdf` : undefined;

  const testRow: ExamTable = {
    testId,
    subject: req.subject,
    mode: req.mode,
    status: 'IN_PROGRESS',
    count: selected.length,
    questions: targetIds,
    createdDate,
    ...(pdfS3Key ? { pdfS3Key } : {}),
    results: [],
  };

  // 非同期処理の完了を待つ
  await deps.repositories.exams.put(testRow);

  // 条件に応じて処理を分岐する
  if (hasKanjiTargets && pdfS3Key) {
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

      // 非同期で必要な値を取得する
      const detail = await deps.getExam(testId);
      // 条件に応じて処理を分岐する
      if (!detail) {
        throw new Error('Review test detail not found after creation');
      }

      // 非同期で必要な値を取得する
      const pdfBuffer = await ExamPdfService.generatePdfBuffer(detail);
      // 非同期処理の完了を待つ
      await deps.repositories.s3.putObject({
        bucket: ENV.FILES_BUCKET_NAME,
        key: pdfS3Key,
        body: pdfBuffer,
        contentType: 'application/pdf',
      });
    } catch (e) {
      // PDF生成/アップロードに失敗した場合はテストを削除し、候補ロックも解放する
      await deps.deleteExam(testId);
      throw e;
    }
  }

  // 処理結果を呼び出し元へ返す
  return toApiExam(testRow) as Exam;
};

// 公開するサービス処理を定義する
export const createCreateExam = (deps: CreateExamDeps): ExamsService['createExam'] => {
  // 処理結果を呼び出し元へ返す
  return createExamImpl.bind(null, deps);
};
