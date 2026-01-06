import { MaterialsService } from '@/services/MaterialsService';
import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import { ReviewTestsService } from '@/services/ReviewTestsService';
import { AwsUtils } from '@/lib/awsUtils';
import { ENV } from '@/lib/env';

export const deleteMaterial = async (id: string): Promise<boolean> => {
  const existing = await MaterialsService.get(id);
  if (!existing) return false;

  const materialQuestions = await QuestionsService.listByMaterialId(id);

  // 教材削除時は、復習候補と問題もまとめて削除する（孤児候補や復習テストへの混入を防ぐため）
  for (const q of materialQuestions) {
    await ReviewTestCandidatesService.deleteOpenCandidatesByTargetId({ subject: q.subjectId, targetId: q.questionId });
    await QuestionsService.delete(q.questionId);
  }

  if (materialQuestions.length > 0) {
    const deletedQuestionIds = new Set(materialQuestions.map((q) => q.questionId));
    const tests = await ReviewTestsService.scanAll();

    for (const test of tests) {
      if (test.mode !== 'QUESTION') continue;

      const hasAny =
        test.questions?.some((qid) => deletedQuestionIds.has(qid)) ||
        test.items?.some((it) => it.targetType === 'QUESTION' && deletedQuestionIds.has(it.targetId));
      if (!hasAny) continue;

      const nextQuestions = (test.questions ?? []).filter((qid) => !deletedQuestionIds.has(qid));
      const nextItems = test.items
        ? test.items.filter((it) => !(it.targetType === 'QUESTION' && deletedQuestionIds.has(it.targetId)))
        : undefined;
      const nextResults = test.results ? test.results.filter((r) => !deletedQuestionIds.has(r.id)) : undefined;

      await ReviewTestsService.put({
        ...test,
        questions: nextQuestions,
        count: nextQuestions.length,
        items: nextItems,
        results: nextResults,
      });
    }
  }

  // S3 上の教材ファイルを削除する（materials/{materialId}/...）
  const bucket = ENV.FILES_BUCKET_NAME;
  if (bucket) {
    await AwsUtils.deleteS3Prefix({ bucket, prefix: `materials/${id}/` });
  }

  await MaterialsService.delete(id);
  return true;
};
