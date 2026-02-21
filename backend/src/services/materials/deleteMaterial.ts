import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './materials.types';

// 公開する処理を定義する
export const createDeleteMaterial = (repositories: Repositories): MaterialsService['deleteMaterial'] => {
  // 処理結果を呼び出し元へ返す
  return async (materialId: string): Promise<boolean> => {
    // 内部で利用する処理を定義する
    const existing = await repositories.materials.get(materialId);
    // 条件に応じて処理を分岐する
    if (!existing) return false;

    // 内部で利用する処理を定義する
    const materialQuestions = await repositories.materialQuestions.listByMaterialId(materialId);

    // 教材削除時は、復習候補と問題もまとめて削除する（孤児候補や復習テストへの混入を防ぐため）
    for (const q of materialQuestions) {
      // 非同期処理の完了を待つ
      await repositories.examCandidates.deleteOpenCandidatesByTargetId({
        subject: q.subjectId,
        targetId: q.questionId,
      });
      // 非同期処理の完了を待つ
      await repositories.materialQuestions.delete(q.questionId);
    }

    // 条件に応じて処理を分岐する
    if (materialQuestions.length > 0) {
      // 内部で利用する処理を定義する
      const deletedQuestionIds = new Set(materialQuestions.map((q) => q.questionId));
      // 内部で利用する処理を定義する
      const tests = await repositories.exams.scanAll();

      const detailsByExamId = new Map<string, string[]>();
      await Promise.all(
        tests.map(async (test) => {
          const details = await repositories.examDetails.listByExamId(test.examId);
          detailsByExamId.set(
            test.examId,
            details.map((detail) => detail.targetId),
          );
        }),
      );

      // 対象データを順番に処理する
      for (const test of tests) {
        // 条件に応じて処理を分岐する
        if (test.mode !== 'MATERIAL') continue;

        // 内部で利用する処理を定義する
        const hasAny =
          (detailsByExamId.get(test.examId) ?? []).some((targetId) => deletedQuestionIds.has(targetId)) ||
          test.results?.some((r) => deletedQuestionIds.has(r.id));
        // 条件に応じて処理を分岐する
        if (!hasAny) continue;

        // 内部で利用する処理を定義する
        const nextQuestions = (detailsByExamId.get(test.examId) ?? []).filter((qid) => !deletedQuestionIds.has(qid));
        // 内部で利用する処理を定義する
        const nextResults = test.results ? test.results.filter((r) => !deletedQuestionIds.has(r.id)) : undefined;

        await repositories.examDetails.deleteByExamId(test.examId);
        await repositories.examDetails.putMany(test.examId, nextQuestions, test.mode);

        // 非同期処理の完了を待つ
        await repositories.exams.put({
          ...test,
          count: nextQuestions.length,
          results: nextResults,
        });
      }
    }

    // 内部で利用する処理を定義する
    const bucket = ENV.FILES_BUCKET_NAME;
    // 条件に応じて処理を分岐する
    if (bucket) {
      // 非同期処理の完了を待つ
      await repositories.s3.deletePrefix({ bucket, prefix: `materials/${materialId}/` });
    }

    // 非同期処理の完了を待つ
    await repositories.materials.delete(materialId);
    // 処理結果を呼び出し元へ返す
    return true;
  };
};
