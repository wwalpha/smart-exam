import type { QuestionSearchResult } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

const searchQuestionsImpl = async (
  repositories: Repositories,
  params: Parameters<QuestionsService['searchQuestions']>[0],
): Promise<QuestionSearchResult[]> => {
  const keyword = (params.keyword ?? '').trim().toLowerCase();
  const subject = (params.subject ?? '').trim().toLowerCase();

  const [questions, materials] = await Promise.all([repositories.questions.scanAll(), repositories.materials.list()]);
  const materialById = new Map(materials.map((x) => [x.materialId, x] as const));

  const filtered = questions.filter((q) => {
    if (subject && String(q.subjectId ?? '').toLowerCase() !== subject) return false;
    if (!keyword) return true;

    const haystack = [q.canonicalKey]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  });

  return filtered.map((q): QuestionSearchResult => {
    const material = materialById.get(q.materialId);
    return {
      id: q.questionId,
      subject: q.subjectId,
      unit: '',
      questionText: q.canonicalKey,
      sourceMaterialId: q.materialId,
      sourceMaterialName: material?.title ?? '',
    };
  });
};

export const createSearchQuestions = (repositories: Repositories): QuestionsService['searchQuestions'] => {
  return searchQuestionsImpl.bind(null, repositories);
};
