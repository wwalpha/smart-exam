import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

// 内部で利用する補助処理を定義する
const submitExamResultsImpl = async (
  repositories: Repositories,
  examId: string,
  req: Parameters<ExamsService['submitExamResults']>[1],
): Promise<boolean> => {
  // 非同期で必要な値を取得する
  const test = await repositories.exams.get(examId);
  // 条件に応じて処理を分岐する
  if (!test) return false;

  const details = await repositories.examDetails.listByExamId(examId);
  const targetIds = details.map((detail) => detail.targetId);

  // 処理で使う値を準備する
  const dateYmd = req.date ? DateUtils.toYmd(req.date) : DateUtils.todayYmd();

  // 処理で使う値を準備する
  const nextResults = req.results.map((r) => ({ id: r.id, isCorrect: r.isCorrect }));

  // 非同期処理の完了を待つ
  await repositories.exams.put({
    ...test,
    submittedDate: dateYmd,
    results: nextResults,
  });

  // 処理で使う値を準備する
  const resultByTargetId = new Map(req.results.map((r) => [r.id, r.isCorrect] as const));

  // 非同期処理の完了を待つ
  await Promise.all(
    targetIds.map(async (targetId) => {
      // 処理で使う値を準備する
      const isCorrect = resultByTargetId.get(targetId);

      // 非同期で必要な値を取得する
      const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
        subject: test.subject,
        targetId,
      });

      // 例外が発生しうる処理を実行する
      try {
        // 条件に応じて処理を分岐する
        if (typeof isCorrect === 'boolean') {
          // 処理で使う値を準備する
          const baseDateYmd = dateYmd;
          // 処理で使う値を準備する
          const currentCorrectCount = open ? open.correctCount : 0;
          // 処理で使う値を準備する
          const computed = ReviewNextTime.compute({
            mode: test.mode,
            baseDateYmd,
            isCorrect,
            currentCorrectCount,
          });

          // 条件に応じて処理を分岐する
          if (open) {
            // 非同期処理の完了を待つ
            await repositories.examCandidates.closeCandidateIfMatch({
              subject: test.subject,
              candidateKey: open.candidateKey,
              expectedExamId: examId,
            });
          }

          // 非同期処理の完了を待つ
          await repositories.examCandidates.createCandidate({
            subject: test.subject,
            questionId: targetId,
            mode: test.mode,
            nextTime: computed.nextTime,
            correctCount: computed.nextCorrectCount,
            status: computed.nextTime === ReviewNextTime.EXCLUDED_NEXT_TIME ? 'EXCLUDED' : 'OPEN',
          });
          // 処理結果を呼び出し元へ返す
          return;
        }

        // 条件に応じて処理を分岐する
        if (open && open.examId === examId) {
          // 非同期処理の完了を待つ
          await repositories.examCandidates.releaseLockIfMatch({
            subject: test.subject,
            candidateKey: open.candidateKey,
            examId,
          });
        }
      } catch (e: unknown) {
        // 処理で使う値を準備する
        const name = (e as { name?: string } | null)?.name;
        // 条件に応じて処理を分岐する
        if (name === 'ConditionalCheckFailedException') return;
        throw e;
      }
    }),
  );

  // 処理結果を呼び出し元へ返す
  return true;
};

// 公開するサービス処理を定義する
export const createSubmitExamResults = (repositories: Repositories): ExamsService['submitExamResults'] => {
  // 処理結果を呼び出し元へ返す
  return submitExamResultsImpl.bind(null, repositories);
};
