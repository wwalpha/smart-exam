import type {
  CreateReviewTestRequest,
  ReviewMode,
  ReviewTest,
  ReviewTestCandidateTable,
  ReviewTestDetail,
  ReviewTestTarget,
  SearchReviewTestsRequest,
  SearchReviewTestsResponse,
  SubjectId,
  SubmitReviewTestResultsRequest,
  UpdateReviewTestStatusRequest,
} from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { DateUtils } from '@/lib/dateUtils';
import { ENV } from '@/lib/env';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { ReviewTestTable, WordMasterTable } from '@/types/db';
import type { Repositories } from '@/repositories/createRepositories';
import { sortTargets, toApiReviewTest, toReviewTargetKey } from './internal';
import { ReviewTestPdfService } from './reviewTestPdfService';

export type ReviewTestsService = {
  listReviewTests: () => Promise<ReviewTest[]>;
  searchReviewTests: (params: SearchReviewTestsRequest) => Promise<SearchReviewTestsResponse>;
  createReviewTest: (req: CreateReviewTestRequest) => Promise<ReviewTest>;
  getReviewTest: (testId: string) => Promise<ReviewTestDetail | null>;
  getReviewTestPdfUrl: (testId: string) => Promise<{ url: string } | null>;
  updateReviewTestStatus: (testId: string, req: UpdateReviewTestStatusRequest) => Promise<ReviewTest | null>;
  submitReviewTestResults: (testId: string, req: SubmitReviewTestResultsRequest) => Promise<boolean>;
  deleteReviewTest: (testId: string) => Promise<boolean>;
  listReviewTestTargets: (params: {
    mode: ReviewMode;
    fromYmd: string;
    toYmd: string;
    subject?: SubjectId;
  }) => Promise<ReviewTestTarget[]>;
  listReviewTestCandidates: (params: { subject?: SubjectId; mode?: ReviewMode }) => Promise<ReviewTestCandidateTable[]>;
};

type ReviewCandidate = {
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
  subject: SubjectId;
  registeredDate: string;
  dueDate: string | null;
  lastAttemptDate: string;
  candidateKey?: string;
};

export const createReviewTestsService = (repositories: Repositories): ReviewTestsService => {
  const listReviewTests: ReviewTestsService['listReviewTests'] = async () => {
    const items: ReviewTestTable[] = await repositories.reviewTests.scanAll();

    // stable ordering: createdDate desc then testId desc
    items.sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      return a.testId < b.testId ? 1 : -1;
    });

    return items.map(toApiReviewTest);
  };

  const searchReviewTests: ReviewTestsService['searchReviewTests'] = async (params) => {
    const items = await listReviewTests();

    const filtered = items.filter((x) => {
      if (x.mode !== params.mode) return false;
      if (params.subject !== 'ALL' && x.subject !== params.subject) return false;
      if (params.status && params.status !== 'ALL' && x.status !== params.status) return false;
      return true;
    });

    return { items: filtered, total: filtered.length };
  };

  const listDueCandidates = async (params: {
    subject: SubjectId;
    mode?: ReviewMode;
    todayYmd?: string;
  }): Promise<ReviewTestCandidateTable[]> => {
    const today = params.todayYmd ?? DateUtils.todayYmd();

    return repositories.reviewTestCandidates.listDueCandidates({
      subject: params.subject,
      mode: params.mode,
      todayYmd: today,
    });
  };

  const lockCandidate = async (params: { subject: SubjectId; candidateKey: string; testId: string }): Promise<void> => {
    await repositories.reviewTestCandidates.lockCandidateIfUnlocked({
      subject: params.subject,
      candidateKey: params.candidateKey,
      testId: params.testId,
      status: 'LOCKED',
    });
  };

  const deleteReviewTest: ReviewTestsService['deleteReviewTest'] = async (testId) => {
    const existing = await repositories.reviewTests.get(testId);
    if (!existing) return false;

    await Promise.all(
      (existing.questions ?? []).map(async (targetId) => {
        try {
          const candidate = await repositories.reviewTestCandidates.getLatestCandidateByTargetId({
            subject: existing.subject,
            targetId,
          });
          if (!candidate) return;
          if (candidate.testId !== testId) return;

          await repositories.reviewTestCandidates.releaseLockIfMatch({
            subject: existing.subject,
            candidateKey: candidate.candidateKey,
            testId,
          });
        } catch (e: unknown) {
          const name = (e as { name?: string } | null)?.name;
          if (name === 'ConditionalCheckFailedException') return;
          throw e;
        }
      }),
    );

    await repositories.reviewTests.delete(testId);

    return true;
  };

  const createReviewTest: ReviewTestsService['createReviewTest'] = async (req) => {
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

    await repositories.reviewTests.put(testRow);

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

        const detail = await getReviewTest(testId);
        if (!detail) {
          throw new Error('Review test detail not found after creation');
        }

        const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(detail);
        await repositories.s3.putObject({
          bucket: ENV.FILES_BUCKET_NAME,
          key: pdfS3Key,
          body: pdfBuffer,
          contentType: 'application/pdf',
        });
      } catch (e) {
        // PDF生成/アップロードに失敗した場合はテストを削除し、候補ロックも解放する
        await deleteReviewTest(testId);
        throw e;
      }
    }

    return toApiReviewTest(testRow);
  };

  const getReviewTest: ReviewTestsService['getReviewTest'] = async (testId) => {
    const test = await repositories.reviewTests.get(testId);
    if (!test) return null;

    const resultByTargetId = new Map((test.results ?? []).map((r) => [r.id, r.isCorrect] as const));

    if (test.mode === 'KANJI') {
      const words = await Promise.all(test.questions.map((id) => repositories.wordMaster.get(id)));
      const byId = new Map(
        words.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w.wordId, w] as const),
      );

      return {
        ...toApiReviewTest(test),
        items: test.questions.map((targetId) => {
          const w = byId.get(targetId);
          const isCorrect = resultByTargetId.get(targetId);
          return {
            id: targetId,
            itemId: targetId,
            testId,
            targetType: 'KANJI',
            targetId,
            kanji: w?.question,
            reading: w?.answer,
            questionText: w?.question,
            answerText: w?.answer,
            ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
          };
        }),
      };
    }

    const questionRows = await Promise.all(test.questions.map((qid) => repositories.questions.get(qid)));
    const qById = new Map(
      questionRows.filter((q): q is NonNullable<typeof q> => q !== null).map((q) => [q.questionId, q] as const),
    );

    const materialIds = Array.from(new Set(Array.from(qById.values()).map((q) => q.materialId)));
    const materialRows = await Promise.all(materialIds.map((mid) => repositories.materials.get(mid)));
    const mById = new Map(
      materialRows.filter((m): m is NonNullable<typeof m> => m !== null).map((m) => [m.materialId, m] as const),
    );

    return {
      ...toApiReviewTest(test),
      items: test.questions.map((targetId) => {
        const q = qById.get(targetId);
        const m = q ? mById.get(q.materialId) : undefined;
        const isCorrect = resultByTargetId.get(targetId);

        return {
          id: targetId,
          itemId: targetId,
          testId,
          targetType: 'QUESTION',
          targetId,
          displayLabel: q?.canonicalKey,
          canonicalKey: q?.canonicalKey,
          materialId: q?.materialId,
          grade: m?.grade,
          provider: m?.provider,
          materialName: m?.title,
          materialDate: m?.materialDate,
          questionText: q?.canonicalKey,
          ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
        };
      }),
    };
  };

  const listReviewTestTargets: ReviewTestsService['listReviewTestTargets'] = async (params) => {
    const from = params.fromYmd;
    const to = params.toYmd;

    const rows: ReviewTestTable[] = await repositories.reviewTests.scanAll();

    const filteredRows = rows.filter((t) => {
      if (t.mode !== params.mode) return false;
      if (params.subject && String(t.subject) !== String(params.subject)) return false;
      if (t.createdDate < from) return false;
      if (t.createdDate > to) return false;
      return true;
    });

    const byKey = new Map<string, ReviewTestTarget>();

    const allTargetIds = new Set<string>();
    for (const t of filteredRows) {
      for (const id of t.questions ?? []) allTargetIds.add(id);
    }

    const questionById = new Map<string, { canonicalKey?: string; materialId?: string }>();
    const materialById = new Map<string, { title?: string; materialDate?: string }>();
    const wordById = new Map<string, WordMasterTable>();

    if (params.mode === 'QUESTION') {
      const qRows = await Promise.all(Array.from(allTargetIds).map((qid) => repositories.questions.get(qid)));
      for (const q of qRows) {
        if (!q) continue;
        questionById.set(q.questionId, { canonicalKey: q.canonicalKey, materialId: q.materialId });
      }

      const materialIds = Array.from(
        new Set(
          Array.from(questionById.values())
            .map((q) => q.materialId)
            .filter((x): x is string => !!x),
        ),
      );
      const mRows = await Promise.all(materialIds.map((mid) => repositories.materials.get(mid)));
      for (const m of mRows) {
        if (!m) continue;
        materialById.set(m.materialId, { title: m.title, materialDate: m.materialDate });
      }
    } else {
      const wRows = await Promise.all(Array.from(allTargetIds).map((wid) => repositories.wordMaster.get(wid)));
      for (const w of wRows) {
        if (!w) continue;
        wordById.set(w.wordId, w as WordMasterTable);
      }
    }

    for (const t of filteredRows) {
      for (const targetId of t.questions ?? []) {
        const key = toReviewTargetKey(t.subject, targetId);
        const current = byKey.get(key);

        const q = questionById.get(targetId);
        const m = q?.materialId ? materialById.get(q.materialId) : undefined;
        const w = wordById.get(targetId);
        const reading = (w as unknown as (WordMasterTable & { reading?: string }) | undefined)?.answer;

        if (!current) {
          byKey.set(key, {
            targetType: params.mode,
            targetId,
            subject: t.subject,
            displayLabel: q?.canonicalKey,
            canonicalKey: q?.canonicalKey,
            kanji: w?.question,
            reading,
            materialName: m?.title,
            materialDate: m?.materialDate,
            questionText: params.mode === 'QUESTION' ? q?.canonicalKey : w?.question,
            lastTestCreatedDate: t.createdDate,
            includedCount: 1,
          });
          continue;
        }

        const nextLast = current.lastTestCreatedDate < t.createdDate ? t.createdDate : current.lastTestCreatedDate;

        byKey.set(key, {
          ...current,
          displayLabel: current.displayLabel ?? q?.canonicalKey,
          canonicalKey: current.canonicalKey ?? q?.canonicalKey,
          kanji: current.kanji ?? w?.question,
          reading: current.reading ?? reading,
          materialName: current.materialName ?? m?.title,
          materialDate: current.materialDate ?? m?.materialDate,
          questionText: current.questionText ?? (params.mode === 'QUESTION' ? q?.canonicalKey : w?.question),
          lastTestCreatedDate: nextLast,
          includedCount: (current.includedCount ?? 0) + 1,
        });
      }
    }

    return sortTargets(Array.from(byKey.values()));
  };

  const listReviewTestCandidates: ReviewTestsService['listReviewTestCandidates'] = async (params) => {
    return await repositories.reviewTestCandidates.listCandidates(params);
  };

  const updateReviewTestStatus: ReviewTestsService['updateReviewTestStatus'] = async (testId, req) => {
    const existing = await repositories.reviewTests.get(testId);
    if (!existing) return null;

    const updated: ReviewTestTable | null = await repositories.reviewTests.updateStatus(testId, req.status);
    return updated ? toApiReviewTest(updated) : null;
  };

  const submitReviewTestResults: ReviewTestsService['submitReviewTestResults'] = async (testId, req) => {
    const test = await repositories.reviewTests.get(testId);
    if (!test) return false;

    const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();

    const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));

    await repositories.reviewTests.put({
      ...test,
      submittedDate: dateYmd,
      results: nextResults,
    });

    const resultByTargetId = new Map(req.results.map((r) => [r.id, r.isCorrect] as const));

    await Promise.all(
      test.questions.map(async (targetId) => {
        const isCorrect = resultByTargetId.get(targetId);

        const open = await repositories.reviewTestCandidates.getLatestOpenCandidateByTargetId({
          subject: test.subject,
          targetId,
        });

        try {
          if (typeof isCorrect === 'boolean') {
            const baseDateYmd = dateYmd;
            const currentCorrectCount = open ? open.correctCount : 0;
            const computed = ReviewNextTime.compute({
              mode: test.mode,
              baseDateYmd,
              isCorrect,
              currentCorrectCount,
            });

            if (open) {
              await repositories.reviewTestCandidates.closeCandidateIfMatch({
                subject: test.subject,
                candidateKey: open.candidateKey,
                expectedTestId: testId,
              });
            }

            await repositories.reviewTestCandidates.createCandidate({
              subject: test.subject,
              questionId: targetId,
              mode: test.mode,
              nextTime: computed.nextTime,
              correctCount: computed.nextCorrectCount,
              status: computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'OPEN',
            });
            return;
          }

          if (open && open.testId === testId) {
            await repositories.reviewTestCandidates.releaseLockIfMatch({
              subject: test.subject,
              candidateKey: open.candidateKey,
              testId,
            });
          }
        } catch (e: unknown) {
          const name = (e as { name?: string } | null)?.name;
          if (name === 'ConditionalCheckFailedException') return;
          throw e;
        }
      }),
    );

    return true;
  };

  const getReviewTestPdfUrl: ReviewTestsService['getReviewTestPdfUrl'] = async (testId) => {
    const testRow = await repositories.reviewTests.get(testId);
    if (!testRow) return null;

    if (!ENV.FILES_BUCKET_NAME) {
      throw new ApiError(
        'FILES_BUCKET_NAME is not configured',
        500,
        ['internal_server_error'],
        ['files_bucket_not_configured'],
      );
    }

    // まずテーブルの pdfS3Key を使って presign（KANJI は作成時に生成済み）
    if (testRow.mode === 'KANJI' && testRow.pdfS3Key) {
      const url = await repositories.s3.getPresignedGetUrl({
        bucket: ENV.FILES_BUCKET_NAME,
        key: testRow.pdfS3Key,
        responseContentDisposition: 'inline',
        expiresInSeconds: 3600,
      });
      return { url };
    }

    // QUESTION 等は生成（後方互換: pdfS3Key が無いKANJIもここで生成して復旧）
    const review = await getReviewTest(testId);
    if (!review) return null;

    const pdfBuffer = await ReviewTestPdfService.generatePdfBuffer(review);
    const key = testRow.pdfS3Key ?? `review-tests/${testId}.pdf`;

    await repositories.s3.putObject({
      bucket: ENV.FILES_BUCKET_NAME,
      key,
      body: pdfBuffer,
      contentType: 'application/pdf',
    });

    const url = await repositories.s3.getPresignedGetUrl({
      bucket: ENV.FILES_BUCKET_NAME,
      key,
      responseContentDisposition: 'inline',
      expiresInSeconds: 3600,
    });

    return { url };
  };

  return {
    listReviewTests,
    searchReviewTests,
    createReviewTest,
    getReviewTest,
    getReviewTestPdfUrl,
    updateReviewTestStatus,
    submitReviewTestResults,
    deleteReviewTest,
    listReviewTestTargets,
    listReviewTestCandidates,
  };
};
