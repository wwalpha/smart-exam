import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialsService } from './createMaterialsService';

export const createDeleteMaterial = (repositories: Repositories): MaterialsService['deleteMaterial'] => {
  return async (materialId) => {
    const existing = await repositories.materials.get(materialId);
    if (!existing) return false;

    const materialQuestions = await repositories.questions.listByMaterialId(materialId);

    // 教材削除時は、復習候補と問題もまとめて削除する（孤児候補や復習テストへの混入を防ぐため）
    for (const q of materialQuestions) {
      await repositories.examCandidates.deleteOpenCandidatesByTargetId({
        subject: q.subjectId,
        targetId: q.questionId,
      });
      await repositories.questions.delete(q.questionId);
    }

    if (materialQuestions.length > 0) {
      const deletedQuestionIds = new Set(materialQuestions.map((q) => q.questionId));
      const tests = await repositories.exams.scanAll();

      for (const test of tests) {
        if (test.mode !== 'QUESTION') continue;

        const hasAny =
          test.questions?.some((qid) => deletedQuestionIds.has(qid)) ||
          test.results?.some((r) => deletedQuestionIds.has(r.id));
        if (!hasAny) continue;

        const nextQuestions = (test.questions ?? []).filter((qid) => !deletedQuestionIds.has(qid));
        const nextResults = test.results ? test.results.filter((r) => !deletedQuestionIds.has(r.id)) : undefined;

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
    if (bucket) {
      await repositories.s3.deletePrefix({ bucket, prefix: `materials/${materialId}/` });
    }

    await repositories.materials.delete(materialId);
    return true;
  };
};
