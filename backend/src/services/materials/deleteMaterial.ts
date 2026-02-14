import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';

// 公開するサービス処理を定義する
export const createDeleteMaterial = (repositories: Repositories): MaterialsService['deleteMaterial'] => {
  // 処理結果を呼び出し元へ返す
  return async (materialId) => {
    // 非同期で必要な値を取得する
    const existing = await repositories.materials.get(materialId);
    // 条件に応じて処理を分岐する
    if (!existing) return false;

    // 非同期で必要な値を取得する
    const materialQuestions = await repositories.questions.listByMaterialId(materialId);

    // 教材削除時は、復習候補と問題もまとめて削除する（孤児候補や復習テストへの混入を防ぐため）
    for (const q of materialQuestions) {
      // 非同期処理の完了を待つ
      await repositories.examCandidates.deleteOpenCandidatesByTargetId({
        subject: q.subjectId,
        targetId: q.questionId,
      });
      // 非同期処理の完了を待つ
      await repositories.questions.delete(q.questionId);
    }

    // 条件に応じて処理を分岐する
    if (materialQuestions.length > 0) {
      // 処理で使う値を準備する
      const deletedQuestionIds = new Set(materialQuestions.map((q) => q.questionId));
      // 非同期で必要な値を取得する
      const tests = await repositories.exams.scanAll();

      // 対象データを順番に処理する
      for (const test of tests) {
        // 条件に応じて処理を分岐する
        if (test.mode !== 'QUESTION') continue;

        // 処理で使う値を準備する
        const hasAny =
          test.questions?.some((qid) => deletedQuestionIds.has(qid)) ||
          test.results?.some((r) => deletedQuestionIds.has(r.id));
        // 条件に応じて処理を分岐する
        if (!hasAny) continue;

        // 処理で使う値を準備する
        const nextQuestions = (test.questions ?? []).filter((qid) => !deletedQuestionIds.has(qid));
        // 処理で使う値を準備する
        const nextResults = test.results ? test.results.filter((r) => !deletedQuestionIds.has(r.id)) : undefined;

        // 非同期処理の完了を待つ
        await repositories.exams.put({
          ...test,
          questions: nextQuestions,
          count: nextQuestions.length,
          results: nextResults,
        });
      }
    }

    // S3 上の教材ファイルを削除する（materials/{materialId}/...）
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
