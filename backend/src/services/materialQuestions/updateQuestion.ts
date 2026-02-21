import type { Question } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestions.types';
import { toSortNumber } from './materialQuestions.lib';

export const createUpdateQuestion = (repositories: Repositories): MaterialQuestionsService['updateQuestion'] => {
  return async (materialId, questionId, updates): Promise<Question | null> => {
    // 更新対象の設問と教材の対応関係を確認する。
    const existing = await repositories.materialQuestions.get(questionId);
    if (!existing) return null;
    if (existing.materialId !== materialId) return null;

    // 教材の存在確認と更新可否（未完了）を検証する。
    const material = await repositories.materials.get(materialId);
    if (!material) {
      throw new ApiError('material not found', 404, ['material_not_found']);
    }
    if (material.isCompleted) {
      // 完了済み教材では設問を変更させない
      throw new ApiError('material is completed', 409, ['material_already_completed']);
    }

    // 指定された項目だけを部分更新し、canonicalKey 更新時は並び順番号も再計算する。
    const next = await repositories.materialQuestions.update(questionId, {
      ...(typeof updates.subject === 'string' ? { subjectId: updates.subject } : {}),
      ...(typeof updates.canonicalKey === 'string'
        ? { canonicalKey: updates.canonicalKey, number: toSortNumber(updates.canonicalKey) }
        : {}),
    });

    if (!next) return null;

    // 更新後レコードをAPIレスポンス形式へ変換する。
    return {
      id: next.questionId,
      canonicalKey: next.canonicalKey,
      subject: next.subjectId,
      materialId: next.materialId,
      choice: next.choice,
      tags: updates.tags ?? [],
    };
  };
};
