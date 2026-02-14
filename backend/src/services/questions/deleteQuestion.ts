import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

// 内部で利用する補助処理を定義する
const deleteQuestionImpl = async (repositories: Repositories, questionId: string): Promise<boolean> => {
  // 非同期で必要な値を取得する
  const existing = await repositories.questions.get(questionId);
  // 条件に応じて処理を分岐する
  if (!existing) return false;

  // 非同期処理の完了を待つ
  await repositories.examCandidates.deleteOpenCandidatesByTargetId({
    subject: existing.subjectId,
    targetId: questionId,
  });

  // 非同期処理の完了を待つ
  await repositories.questions.delete(questionId);
  // 非同期処理の完了を待つ
  await repositories.materials.incrementQuestionCount(existing.materialId, -1);

  // 処理結果を呼び出し元へ返す
  return true;
};

// 公開するサービス処理を定義する
export const createDeleteQuestion = (repositories: Repositories): QuestionsService['deleteQuestion'] => {
  // 処理結果を呼び出し元へ返す
  return deleteQuestionImpl.bind(null, repositories);
};
