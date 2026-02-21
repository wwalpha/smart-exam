import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

// 内部で利用する補助処理を定義する
const markQuestionCorrectImpl = async (repositories: Repositories, questionId: string): Promise<boolean> => {
  // 非同期で必要な値を取得する
  const q = await repositories.materialQuestions.get(questionId);
  // 条件に応じて処理を分岐する
  if (!q) return false;

  // 非同期で必要な値を取得する
  const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
    subject: q.subjectId,
    targetId: questionId,
  });

  // 条件に応じて処理を分岐する
  if (open) {
    // 非同期処理の完了を待つ
    await repositories.examCandidates.deleteCandidate({
      subject: q.subjectId,
      candidateKey: open.candidateKey,
    });
  }

  // 処理結果を呼び出し元へ返す
  return true;
};

// 公開するサービス処理を定義する
export const createMarkQuestionCorrect = (repositories: Repositories): QuestionsService['markQuestionCorrect'] => {
  // 処理結果を呼び出し元へ返す
  return markQuestionCorrectImpl.bind(null, repositories);
};
