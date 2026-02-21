import type { QuestionSearchResult } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

// 内部で利用する処理を定義する
const searchQuestionsImpl = async (
  repositories: Repositories,
  params: Parameters<QuestionsService['searchQuestions']>[0],
): Promise<QuestionSearchResult[]> => {
  // 内部で利用する処理を定義する
  const keyword = (params.keyword ?? '').trim().toLowerCase();
  // 内部で利用する処理を定義する
  const subject = (params.subject ?? '').trim().toLowerCase();

  const [questions, materials] = await Promise.all([
    repositories.materialQuestions.scanAll(),
    repositories.materials.list(),
  ]);
  // 内部で利用する処理を定義する
  const materialById = new Map(materials.map((x) => [x.materialId, x] as const));

  // 内部で利用する処理を定義する
  const filtered = questions.filter((q) => {
    // 条件に応じて処理を分岐する
    if (subject && String(q.subjectId ?? '').toLowerCase() !== subject) return false;
    // 条件に応じて処理を分岐する
    if (!keyword) return true;

    // 内部で利用する処理を定義する
    const haystack = [q.canonicalKey]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' ')
      .toLowerCase();

    // 処理結果を呼び出し元へ返す
    return haystack.includes(keyword);
  });

  // 処理結果を呼び出し元へ返す
  return filtered.map((q): QuestionSearchResult => {
    // 内部で利用する処理を定義する
    const material = materialById.get(q.materialId);
    // 処理結果を呼び出し元へ返す
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

// 公開する処理を定義する
export const createSearchQuestions = (repositories: Repositories): QuestionsService['searchQuestions'] => {
  // 処理結果を呼び出し元へ返す
  return searchQuestionsImpl.bind(null, repositories);
};
