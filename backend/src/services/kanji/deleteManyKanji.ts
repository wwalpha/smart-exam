import type { Repositories } from '@/repositories/createRepositories';
import { logger } from '@/lib/logger';
import pLimit from 'p-limit';

import type { KanjiService } from './kanji.types';

const MAX_CONCURRENCY = 50;

const deleteWordAndCandidates = async (repositories: Repositories, id: string): Promise<string | null> => {
  let existing: Awaited<ReturnType<typeof repositories.kanji.get>>;
  try {
    existing = await repositories.kanji.get(id);
  } catch (error) {
    logger.error(`[kanji.deleteManyKanji] failed to load word id=${id}`, error);
    return null;
  }

  if (!existing) return null;

  try {
    await repositories.examCandidates.deleteCandidatesByTargetId({
      subject: existing.subject,
      targetId: id,
    });
  } catch (error) {
    logger.warn(`[kanji.deleteManyKanji] candidate cleanup failed id=${id}`, error);
  }

  try {
    await repositories.kanji.delete(id);
    return id;
  } catch (error) {
    logger.error(`[kanji.deleteManyKanji] failed to delete word id=${id}`, error);
    return null;
  }
};

const syncExamByDeletedTargets = async (
  repositories: Repositories,
  examId: string,
  deletedIdSet: Set<string>,
): Promise<void> => {
  try {
    const test = await repositories.exams.get(examId);
    if (!test || test.mode !== 'KANJI') return;

    const details = await repositories.examDetails.listByExamId(examId);
    const currentTargetIds = details.map((detail) => detail.targetId);
    const nextQuestions = currentTargetIds.filter((targetId) => !deletedIdSet.has(targetId));

    if (nextQuestions.length === currentTargetIds.length) return;

    const nextResults = (test.results ?? []).filter((result) => !deletedIdSet.has(result.id));

    await repositories.examDetails.deleteByExamId(test.examId);
    await repositories.examDetails.putMany(test.examId, nextQuestions, test.mode);

    const { pdfS3Key: _pdfS3Key, ...rest } = test;
    await repositories.exams.put({
      ...rest,
      count: nextQuestions.length,
      results: nextResults,
    });
  } catch (error) {
    logger.warn(`[kanji.deleteManyKanji] failed to sync exam examId=${examId}`, error);
  }
};

// 公開する処理を定義する
export const createDeleteManyKanji = (repositories: Repositories): KanjiService['deleteManyKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (ids: string[]): Promise<void> => {
    const uniqueIds = Array.from(new Set(ids.map((x) => x.trim()).filter((x) => x.length > 0)));
    const limit = pLimit(MAX_CONCURRENCY);

    const deletedIds = (
      await Promise.all(uniqueIds.map((id) => limit(() => deleteWordAndCandidates(repositories, id))))
    ).filter((id): id is string => Boolean(id));

    if (deletedIds.length === 0) return;

    const deletedIdSet = new Set(deletedIds);

    const examIdsByTarget = await Promise.all(
      deletedIds.map((targetId) => limit(() => repositories.examDetails.listExamIdsByTargetId(targetId))),
    );
    const affectedExamIds = Array.from(new Set(examIdsByTarget.flat()));

    await Promise.all(
      affectedExamIds.map((examId) => limit(() => syncExamByDeletedTargets(repositories, examId, deletedIdSet))),
    );
  };
};
