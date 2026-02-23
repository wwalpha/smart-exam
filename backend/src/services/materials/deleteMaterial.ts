import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

export const createDeleteMaterial = async (repositories: Repositories, materialId: string): Promise<boolean> => {
  const existing = await repositories.materials.get(materialId);
  if (!existing) return false;

  const materialQuestions = await repositories.materialQuestions.listByMaterialId(materialId);

  // 教材削除時は、復習候補と問題もまとめて削除する（孤児候補や復習テストへの混入を防ぐため）
  await Promise.all(
    materialQuestions.map(async (question) => {
      await repositories.examCandidates.deleteOpenCandidatesByTargetId({
        subject: question.subjectId,
        targetId: question.questionId,
      });
      await repositories.materialQuestions.delete(question.questionId);
    }),
  );

  if (materialQuestions.length > 0) {
    const deletedQuestionIds = new Set(materialQuestions.map((question) => question.questionId));
    const exam = await repositories.exams.scanAll();

    const detailsByExamId = new Map<string, string[]>();
    await Promise.all(
      exam.map(async (test) => {
        const details = await repositories.examDetails.listByExamId(test.examId);
        detailsByExamId.set(
          test.examId,
          details.map((detail) => detail.targetId),
        );
      }),
    );

    await Promise.all(
      exam.map(async (test) => {
        if (test.mode !== 'MATERIAL') return;

        const hasAny =
          (detailsByExamId.get(test.examId) ?? []).some((targetId) => deletedQuestionIds.has(targetId)) ||
          test.results?.some((result) => deletedQuestionIds.has(result.id));
        if (!hasAny) return;

        const nextQuestions = (detailsByExamId.get(test.examId) ?? []).filter(
          (questionId) => !deletedQuestionIds.has(questionId),
        );
        const nextResults = test.results
          ? test.results.filter((result) => !deletedQuestionIds.has(result.id))
          : undefined;

        await repositories.examDetails.deleteByExamId(test.examId);
        await repositories.examDetails.putMany(test.examId, nextQuestions, test.mode);

        await repositories.exams.put({
          ...test,
          count: nextQuestions.length,
          results: nextResults,
        });
      }),
    );
  }

  const bucket = ENV.FILES_BUCKET_NAME;
  if (bucket) {
    await repositories.s3.deletePrefix({ bucket, prefix: `materials/${materialId}/` });
  }

  await repositories.materials.delete(materialId);
  return true;
};
