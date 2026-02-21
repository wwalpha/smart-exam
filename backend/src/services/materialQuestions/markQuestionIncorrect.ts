import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { MaterialQuestionsService } from './materialQuestionsService.types';

// 内部で利用する補助処理を定義する
const markQuestionIncorrectImpl = async (repositories: Repositories, questionId: string): Promise<boolean> => {
  // 非同期で必要な値を取得する
  const q = await repositories.materialQuestions.get(questionId);
  // 条件に応じて処理を分岐する
  if (!q) return false;

  // 非同期で必要な値を取得する
  const material = await repositories.materials.get(q.materialId);
  // 処理で使う値を準備する
  const preferred = material?.registeredDate ?? material?.materialDate ?? '';
  // 処理で使う値を準備する
  const baseDateYmd = DateUtils.isValidYmd(preferred) ? preferred : DateUtils.todayYmd();

  // 非同期で必要な値を取得する
  const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
    subject: q.subjectId,
    targetId: questionId,
  });

  // 処理で使う値を準備する
  const currentCorrectCount = open ? open.correctCount : 0;
  // 条件に応じて処理を分岐する
  if (open) {
    // 非同期処理の完了を待つ
    await repositories.examCandidates.closeCandidateIfMatch({
      subject: q.subjectId,
      candidateKey: open.candidateKey,
    });
  }

  // 処理で使う値を準備する
  const computed = ReviewNextTime.compute({
    mode: 'MATERIAL',
    baseDateYmd,
    isCorrect: false,
    currentCorrectCount,
  });

  // 非同期処理の完了を待つ
  await repositories.examCandidates.createCandidate({
    subject: q.subjectId,
    questionId,
    mode: 'MATERIAL',
    nextTime: computed.nextTime,
    correctCount: computed.nextCorrectCount,
    status: 'OPEN',
  });

  // 処理結果を呼び出し元へ返す
  return true;
};

// 公開するサービス処理を定義する
export const createMarkQuestionIncorrect = (
  repositories: Repositories,
): MaterialQuestionsService['markQuestionIncorrect'] => {
  // 処理結果を呼び出し元へ返す
  return markQuestionIncorrectImpl.bind(null, repositories);
};
