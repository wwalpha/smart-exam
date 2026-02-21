import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './kanji.types';

const syncExamByDeletedTarget = async (
  repositories: Repositories,
  examId: string,
  deletedTargetId: string,
): Promise<void> => {
  const exam = await repositories.exams.get(examId);
  if (!exam || exam.mode !== 'KANJI') return;

  const details = await repositories.examDetails.listByExamId(examId);
  const currentTargetIds = details.map((detail) => detail.targetId);
  const nextTargetIds = currentTargetIds.filter((targetId) => targetId !== deletedTargetId);

  if (nextTargetIds.length === currentTargetIds.length) return;

  const nextResults = (exam.results ?? []).filter((result) => result.id !== deletedTargetId);

  await repositories.examDetails.deleteByExamId(exam.examId);
  await repositories.examDetails.putMany(exam.examId, nextTargetIds, exam.mode);

  // 不整合を避けるため既存PDFキーは引き継がず更新する
  const { pdfS3Key: _pdfS3Key, ...rest } = exam;
  await repositories.exams.put({
    ...rest,
    count: nextTargetIds.length,
    results: nextResults,
  });
};

// リポジトリを束縛した削除関数を公開する
export const createDeleteKanji = (repositories: Repositories): KanjiService['deleteKanji'] => {
  // 呼び出し側へ削除関数を返す
  return async (id: string): Promise<boolean> => {
    // 削除対象の漢字データを取得する
    const existing = await repositories.kanji.get(id);
    // 対象が存在しない場合は削除失敗として false を返す
    if (!existing) return false;

    // 対象漢字に紐づく復習候補を先に削除する
    await repositories.examCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });

    // exam_details の targetId GSI で影響試験を特定して更新する
    const affectedExamIds = await repositories.examDetails.listExamIdsByTargetId(id);
    await Promise.all(affectedExamIds.map((examId) => syncExamByDeletedTarget(repositories, examId, id)));

    // 最後に漢字マスタ本体を削除する
    await repositories.kanji.delete(id);
    // 正常に削除できたため true を返す
    return true;
  };
};
