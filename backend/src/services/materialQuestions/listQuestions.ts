import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';

export const createListQuestions = (repositories: Repositories): MaterialQuestionsService['listQuestions'] => {
  return async (materialId) => {
    // 指定教材の設問一覧を取得する。
    const rows = await repositories.materialQuestions.listByMaterialId(materialId);
    // DB行をAPIレスポンス形式へ変換する。
    return rows.map((row) => ({
      id: row.questionId,
      canonicalKey: row.canonicalKey,
      subject: row.subjectId,
      materialId: row.materialId,
      choice: row.choice,
      tags: [],
    }));
  };
};
