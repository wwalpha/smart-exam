import { ENV } from '@/lib/env';
import type { Repositories } from '@/repositories/createRepositories';

export const createDeleteMaterial = async (repositories: Repositories, materialId: string): Promise<boolean> => {
  const existing = await repositories.materials.get(materialId);
  if (!existing) return false;

  const materialQuestions = await repositories.materialQuestions.listByMaterialId(materialId);

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

        await repositories.materialReviews.removeMaterialTargets(test.examId, [...deletedQuestionIds], materialId);
      }),
    );
  }

  await Promise.all(materialQuestions.map(async (question) => {
    await repositories.materialQuestions.delete(question.questionId);
    const candidates = await repositories.materialReviews.listQuestionCandidates(question.subjectId, question.questionId);
    await Promise.all(candidates.map((candidate) => repositories.examCandidates.deleteCandidate({ subject: candidate.subject, candidateKey: candidate.candidateKey })));
  }));

  const bucket = ENV.FILES_BUCKET_NAME;
  if (bucket) {
    await repositories.s3.deletePrefix({ bucket, prefix: `materials/${materialId}/` });
  }

  await repositories.materials.delete(materialId);
  return true;
};
