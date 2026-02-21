import { ReviewNextTime } from '@/lib/reviewNextTime';
import type { Repositories } from '@/repositories/createRepositories';

import type { QuestionsService } from './createQuestionsService';

// 内部で利用する処理を定義する
const recalculateCandidatesForMaterialImpl = async (
  repositories: Repositories,
  params: { materialId: string; registeredDate: string },
): Promise<void> => {
  // 内部で利用する処理を定義する
  const questions = await repositories.materialQuestions.listByMaterialId(params.materialId);

  // 対象データを順番に処理する
  for (const q of questions) {
    // 内部で利用する処理を定義する
    const open = await repositories.examCandidates.getLatestOpenCandidateByTargetId({
      subject: q.subjectId,
      targetId: q.questionId,
    });

    // 条件に応じて処理を分岐する
    if (!open) continue;

    // 非同期処理の完了を待つ
    await repositories.examCandidates.closeCandidateIfMatch({
      subject: q.subjectId,
      candidateKey: open.candidateKey,
    });

    // 条件に応じて処理を分岐する
    if (open.correctCount > 0) {
      // 非同期処理の完了を待つ
      await repositories.examCandidates.createCandidate({
        subject: q.subjectId,
        questionId: q.questionId,
        mode: 'MATERIAL',
        nextTime: ReviewNextTime.EXCLUDED_NEXT_TIME,
        correctCount: open.correctCount,
        status: 'EXCLUDED',
      });
      continue;
    }

    // 内部で利用する処理を定義する
    const computed = ReviewNextTime.compute({
      mode: 'MATERIAL',
      baseDateYmd: params.registeredDate,
      isCorrect: false,
      currentCorrectCount: 0,
    });

    // 非同期処理の完了を待つ
    await repositories.examCandidates.createCandidate({
      subject: q.subjectId,
      questionId: q.questionId,
      mode: 'MATERIAL',
      nextTime: computed.nextTime,
      correctCount: computed.nextCorrectCount,
      status: 'OPEN',
    });
  }
};

// 公開する処理を定義する
export const createRecalculateCandidatesForMaterial = (
  repositories: Repositories,
): QuestionsService['recalculateCandidatesForMaterial'] => {
  // 処理結果を呼び出し元へ返す
  return recalculateCandidatesForMaterialImpl.bind(null, repositories);
};
