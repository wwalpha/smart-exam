import type { ReviewMode, ReviewTest, SubjectId } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestCandidateTable, ReviewTestTable, WordMasterTable } from '@/types/db';

import { computeKanjiQuestionFields } from '@/services/kanji/computeKanjiQuestionFields';

import type { ReviewTestsService } from './createExamsService';
import { toApiReviewTest } from './internal';
import { ReviewTestPdfService } from './examPdfService';

type ReviewCandidate = {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
  subject: SubjectId;
  registeredDate: string;
  dueDate: string | null;
  lastAttemptDate: string;
  candidateKey?: string;
};

export const createCreateReviewTest = (deps: {
  repositories: Repositories;
  getExam: ReviewTestsService['getExam'];
  deleteExam: ReviewTestsService['deleteExam'];
}): ReviewTestsService['createExam'] => {
  const isPrintableKanjiWorksheetWord = (w: WordMasterTable): boolean => {
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

  const printableWordIds = (byId: Map<string, WordMasterTable>): Set<string> => {
    return new Set(
      Array.from(byId.values())
        .filter((w) => isPrintableKanjiWorksheetWord(w))
        .map((w) => w.wordId),
    );
  };

  const listDueCandidates = async (params: {
    subject: SubjectId;
    mode?: ReviewMode;
    todayYmd?: string;
  }): Promise<ReviewTestCandidateTable[]> => {
    const today = params.todayYmd ?? DateUtils.todayYmd();

    return deps.repositories.reviewTestCandidates.listDueCandidates({
      subject: params.subject,
      mode: params.mode,
      todayYmd: today,
    });
  };

  const lockCandidate = async (params: { subject: SubjectId; candidateKey: string; testId: string }): Promise<void> => {
    await deps.repositories.reviewTestCandidates.lockCandidateIfUnlocked({
      subject: params.subject,
      candidateKey: params.candidateKey,
      testId: params.testId,
      status: 'LOCKED',
    });
  };

  return async (req): Promise<ReviewTest> => {
    const testId = createUuid();
    const createdDate = DateUtils.todayYmd();

    const candidates: ReviewCandidate[] = [];

    // 候補テーブルから取得する (要件: Master全スキャンではなく候補テーブルを使用)
    const due = await listDueCandidates({ subject: req.subject, mode: req.mode });
    for (const c of due) {
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
      const ids = Array.from(new Set(candidates.map((c) => c.targetId)));
      const words = await Promise.all(ids.map((id) => deps.repositories.wordMaster.get(id)));
      const byId = new Map(words.filter((w): w is WordMasterTable => w !== null).map((w) => [w.wordId, w] as const));

      let printableIds = printableWordIds(byId);

      // 既存データに不足フィールドがあると 0 件になりやすいので、全滅時のみ自動補完を試みる
      if (printableIds.size === 0 && byId.size > 0) {
        const toFill = Array.from(byId.values()).filter((w) => {
          if (isPrintableKanjiWorksheetWord(w)) return false;
          return Boolean(String(w.question ?? '').trim() && String(w.answer ?? '').trim());
        });

        if (toFill.length > 0) {
          try {
            const bulk = await deps.repositories.bedrock.generateKanjiQuestionReadingsBulk({
              items: toFill.map((w) => ({
                id: w.wordId,
                question: String(w.question ?? ''),
                answer: String(w.answer ?? ''),
              })),
            });
            const generatedById = new Map(bulk.items.map((x) => [String(x.id ?? ''), x] as const));

            await Promise.all(
              toFill.map(async (w) => {
                const generated = generatedById.get(w.wordId);
                if (!generated) return;

                const readingHiragana = String(generated.readingHiragana ?? '').trim();
                if (!readingHiragana) return;

                try {
                  const computed = computeKanjiQuestionFields({
                    question: w.question,
                    readingHiragana,
                  });

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

      const filtered = candidates.filter((c) => printableIds.has(c.targetId));
      candidates.length = 0;
      candidates.push(...filtered);
    }

    // 要件 8.3: dueDate asc -> lastAttemptDate asc -> ID asc (deterministic)
    candidates.sort((a, b) => {
      if (a.dueDate !== b.dueDate) return (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1;
      if (a.lastAttemptDate !== b.lastAttemptDate) return a.lastAttemptDate < b.lastAttemptDate ? -1 : 1;
      if (a.targetId !== b.targetId) return a.targetId < b.targetId ? -1 : 1;
      return a.targetType < b.targetType ? -1 : a.targetType > b.targetType ? 1 : 0;
    });

    const selected: ReviewCandidate[] = [];
    for (const c of candidates) {
      if (selected.length >= req.count) break;
      if (!c.dueDate) continue;

      try {
        if (c.candidateKey) {
          await lockCandidate({ subject: c.subject, candidateKey: c.candidateKey, testId });
        }
        selected.push(c);
      } catch (e: unknown) {
        const name = (e as { name?: string } | null)?.name;
        if (name === 'ConditionalCheckFailedException') continue;
        throw e;
      }
    }

    const targetIds = selected.map((c) => c.targetId);
    const pdfS3Key = req.mode === 'KANJI' ? `review-tests/${testId}.pdf` : undefined;

    if (req.mode === 'KANJI' && targetIds.length === 0) {
      throw new ApiError('No printable kanji items (missing required fields)', 400, ['no_printable_items']);
    }

    const testRow: ReviewTestTable = {
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

    await deps.repositories.reviewTests.put(testRow);

    if (req.mode === 'KANJI' && pdfS3Key) {
      try {
        if (!ENV.FILES_BUCKET_NAME) {
          throw new ApiError(
            'FILES_BUCKET_NAME is not configured',
            500,
            ['internal_server_error'],
            ['files_bucket_not_configured'],
          );
        }

        const detail = await deps.getExam(testId);
        if (!detail) {
          throw new Error('Review test detail not found after creation');
        }

        const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(detail);
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

    return toApiReviewTest(testRow) as ReviewTest;
  };
};
