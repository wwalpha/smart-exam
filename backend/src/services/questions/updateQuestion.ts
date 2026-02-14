import type { Question } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';
import { toSortNumber } from './toSortNumber';

// 内部で利用する補助処理を定義する
const updateQuestionImpl = async (
  repositories: Repositories,
  questionId: string,
  updates: Partial<Parameters<QuestionsService['createQuestion']>[0]>,
): Promise<Question | null> => {
  // 非同期で必要な値を取得する
  const existing = await repositories.questions.get(questionId);
  // 条件に応じて処理を分岐する
  if (!existing) return null;

  // 非同期で必要な値を取得する
  const next = await repositories.questions.update(questionId, {
    ...(typeof updates.subject === 'string' ? { subjectId: updates.subject } : {}),
    ...(typeof updates.canonicalKey === 'string'
      ? { canonicalKey: updates.canonicalKey, number: toSortNumber(updates.canonicalKey) }
      : {}),
  });

  // 条件に応じて処理を分岐する
  if (!next) return null;

  // 処理結果を呼び出し元へ返す
  return {
    id: next.questionId,
    canonicalKey: next.canonicalKey,
    subject: next.subjectId,
    materialId: next.materialId,
    tags: updates.tags ?? [],
  };
};

// 公開するサービス処理を定義する
export const createUpdateQuestion = (repositories: Repositories): QuestionsService['updateQuestion'] => {
  // 処理結果を呼び出し元へ返す
  return updateQuestionImpl.bind(null, repositories);
};
