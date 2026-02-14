import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

export const createDeleteKanji = (repositories: Repositories): KanjiService['deleteKanji'] => {
  return async (id): Promise<boolean> => {
    const existing = await repositories.wordMaster.get(id);
    if (!existing) return false;

    await repositories.examCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });

    const tests = await repositories.exams.scanAll();
    const affected = tests.filter((t) => t.mode === 'KANJI' && Array.isArray(t.questions) && t.questions.includes(id));

    await Promise.all(
      affected.map(async (t) => {
        const nextQuestions = (t.questions ?? []).filter((x) => x !== id);
        const nextResults = (t.results ?? []).filter((r) => r.id !== id);

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

    await repositories.wordMaster.delete(id);
    return true;
  };
};
