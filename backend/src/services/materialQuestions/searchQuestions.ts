import type { QuestionSearchResult } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createSearchQuestions = (repositories: Repositories): MaterialQuestionsService['searchQuestions'] => {
  return async (params): Promise<QuestionSearchResult[]> => {
    // 検索文字列は前後空白除去・小文字化して比較しやすくする。
    const keyword = (params.keyword ?? '').trim().toLowerCase();
    const subject = (params.subject ?? '').trim().toLowerCase();

    // 設問一覧と教材一覧を並列取得し、後段の表示情報に使う。
    const [questions, materials] = await Promise.all([
      repositories.materialQuestions.scanAll(),
      repositories.materials.list(),
    ]);
    // 教材IDから教材情報を即時参照できるようにしておく。
    const materialById = new Map(materials.map((x) => [x.materialId, x] as const));

    // 件名(subject)完全一致 + canonicalKey 部分一致で絞り込む。
    const filtered = questions.filter((q) => {
      if (subject && String(q.subjectId ?? '').toLowerCase() !== subject) return false;
      if (!keyword) return true;

      const haystack = [q.canonicalKey]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });

    // 検索結果のDTOへ整形し、教材名を補完する。
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
};
