import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

// 内部で利用する補助処理を定義する
const deleteExamImpl = async (repositories: Repositories, examId: string): Promise<boolean> => {
  // 非同期で必要な値を取得する
  const existing = await repositories.exams.get(examId);
  // 条件に応じて処理を分岐する
  if (!existing) return false;

  const details = await repositories.examDetails.listByExamId(examId);
  const targetIds = details.map((detail) => detail.targetId);

  // 非同期処理の完了を待つ
  await Promise.all(
    targetIds.map(async (targetId) => {
      // 例外が発生しうる処理を実行する
      try {
        // 非同期で必要な値を取得する
        const candidate = await repositories.examCandidates.getLatestCandidateByTargetId({
          subject: existing.subject,
          targetId,
        });
        // 条件に応じて処理を分岐する
        if (!candidate) return;
        // 条件に応じて処理を分岐する
        if (candidate.examId !== examId) return;

        // 非同期処理の完了を待つ
        await repositories.examCandidates.releaseLockIfMatch({
          subject: existing.subject,
          candidateKey: candidate.candidateKey,
          examId,
        });
      } catch (e: unknown) {
        // 処理で使う値を準備する
        const name = (e as { name?: string } | null)?.name;
        // 条件に応じて処理を分岐する
        if (name === 'ConditionalCheckFailedException') return;
        throw e;
      }
    }),
  );

  // 非同期処理の完了を待つ
  await repositories.exams.delete(examId);
  await repositories.examDetails.deleteByExamId(examId);

  // 処理結果を呼び出し元へ返す
  return true;
};

// 公開するサービス処理を定義する
export const createDeleteExam = (repositories: Repositories): ExamsService['deleteExam'] => {
  // 処理結果を呼び出し元へ返す
  return deleteExamImpl.bind(null, repositories);
};
