import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

export const createDeleteManyKanji = (repositories: Repositories): KanjiService['deleteManyKanji'] => {
  return async (ids): Promise<void> => {
    const uniqueIds = Array.from(new Set(ids.map((x) => x.trim()).filter((x) => x.length > 0)));
    const deletedIds: string[] = [];
    for (const id of uniqueIds) {
      const existing = await repositories.wordMaster.get(id);
      if (!existing) continue;

      await repositories.examCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });
      await repositories.wordMaster.delete(id);
      deletedIds.push(id);
    }

    if (deletedIds.length === 0) return;

    const deletedIdSet = new Set(deletedIds);
    const tests = await repositories.exams.scanAll();
    const affected = tests.filter(
      (t) =>
        t.mode === 'KANJI' &&
        Array.isArray(t.questions) &&
        t.questions.some((q) => deletedIdSet.has(q)),
    );

    await Promise.all(
      affected.map(async (t) => {
        const nextQuestions = (t.questions ?? []).filter((x) => !deletedIdSet.has(x));
        const nextResults = (t.results ?? []).filter((r) => !deletedIdSet.has(r.id));

        // 既存PDFに削除済み漢字が残るのを避けるため、pdfS3Key を削除して再生成ルートに落とす
        const { pdfS3Key: _pdfS3Key, ...rest } = t;
        await repositories.exams.put({
          ...rest,
          questions: nextQuestions,
          count: nextQuestions.length,
          results: nextResults,
        });
      }),
    );
  };
};
