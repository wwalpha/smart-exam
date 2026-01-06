import { MaterialsService } from '@/services/MaterialsService';
import { QuestionsService } from '@/services/QuestionsService';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';
import { ReviewTestsService } from '@/services/ReviewTestsService';
import { s3Client } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

export const deleteMaterial = async (id: string): Promise<boolean> => {
  const existing = await MaterialsService.get(id);
  if (!existing) return false;

  const materialQuestions = await QuestionsService.listByMaterialId(id);

  // 教材削除時は、復習候補と問題もまとめて削除する（孤児候補や復習テストへの混入を防ぐため）
  for (const q of materialQuestions) {
    await ReviewTestCandidatesService.deleteAny({ subject: q.subjectId, questionId: q.questionId });
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
    const prefix = `materials/${id}/`;
    let continuationToken: string | undefined = undefined;

    // List+Delete を繰り返す（最大 1000 keys / request）
    while (true) {
      const response: ListObjectsV2CommandOutput = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );

      const keys = (response.Contents ?? []).map((obj) => obj.Key).filter((k): k is string => !!k);

      if (keys.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: keys.map((key) => ({ Key: key })),
              Quiet: true,
            },
          })
        );
      }

      if (!response.IsTruncated || !response.NextContinuationToken) break;
      continuationToken = response.NextContinuationToken;
    }
  }

  await MaterialsService.delete(id);
  return true;
};
