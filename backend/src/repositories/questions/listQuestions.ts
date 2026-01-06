import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import type { Question } from '@/repositories/repo.types';

export const listQuestions = async (materialId: string): Promise<Question[]> => {
  const items = await QuestionsService.listByMaterialId(materialId);

  const latestCandidates = await Promise.all(
    items.map((dbItem) =>
      ReviewTestCandidatesService.getLatestCandidateByTargetId({
        subject: dbItem.subjectId,
        targetId: dbItem.questionId,
      })
    )
  );

  return items.map((dbItem, index) => {
    const candidate = latestCandidates[index];

    return {
      id: dbItem.questionId,
      materialId: dbItem.materialId,
      canonicalKey: dbItem.canonicalKey,
      subject: dbItem.subjectId,
      ...(candidate
        ? {
            reviewCandidate: {
              status: candidate.status,
              nextTime: candidate.nextTime,
              correctCount: candidate.correctCount,
            },
          }
        : {}),
    };
  });
};
