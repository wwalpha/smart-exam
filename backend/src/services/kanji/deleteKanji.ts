import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

const deleteKanjiImpl = async (repositories: Repositories, id: string): Promise<boolean> => {
  const existing = await repositories.wordMaster.get(id);
  if (!existing) return false;

  await repositories.examCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });

  const tests = await repositories.exams.scanAll();
  const affected = tests.filter((t) => t.mode === 'KANJI' && Array.isArray(t.questions) && t.questions.includes(id));

  await Promise.all(
    affected.map(async (t) => {
      const nextQuestions = (t.questions ?? []).filter((x) => x !== id);
      const nextResults = (t.results ?? []).filter((r) => r.id !== id);

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

export const createDeleteKanji = (repositories: Repositories): KanjiService['deleteKanji'] => {
  return deleteKanjiImpl.bind(null, repositories);
};
