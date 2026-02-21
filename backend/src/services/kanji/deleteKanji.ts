import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './kanji.types';

// 内部で利用する漢字削除処理
const deleteKanjiImpl = async (repositories: Repositories, id: string): Promise<boolean> => {
  // 削除対象の漢字データを取得する
  const existing = await repositories.wordMaster.get(id);
  // 対象が存在しない場合は削除失敗として false を返す
  if (!existing) return false;

  // 対象漢字に紐づく復習候補を先に削除する
  await repositories.examCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });

  // 既存の復習テストを全件取得する
  const tests = await repositories.exams.scanAll();

  const detailsByExamId = new Map<string, string[]>();
  await Promise.all(
    tests.map(async (test) => {
      const details = await repositories.examDetails.listByExamId(test.examId);
      detailsByExamId.set(
        test.examId,
        details.map((detail) => detail.targetId),
      );
    }),
  );

  // 対象漢字を含むKANJIモードのテストだけを抽出する
  const affected = tests.filter(
    (test) => test.mode === 'KANJI' && (detailsByExamId.get(test.examId) ?? []).includes(id),
  );

  // 影響のあるテストから対象漢字を取り除いて更新する
  await Promise.all(
    affected.map(async (t) => {
      // 問題一覧から対象漢字IDを除外する
      const nextQuestions = (detailsByExamId.get(t.examId) ?? []).filter((x) => x !== id);
      // 結果一覧から対象漢字IDの結果を除外する
      const nextResults = (t.results ?? []).filter((r) => r.id !== id);

      await repositories.examDetails.deleteByExamId(t.examId);
      await repositories.examDetails.putMany(t.examId, nextQuestions, t.mode);

      // 不整合を避けるため既存PDFキーは引き継がず更新する
      const { pdfS3Key: _pdfS3Key, ...rest } = t;
      await repositories.exams.put({
        ...rest,
        count: nextQuestions.length,
        results: nextResults,
      });
    }),
  );

  // 最後に漢字マスタ本体を削除する
  await repositories.wordMaster.delete(id);
  // 正常に削除できたため true を返す
  return true;
};

// リポジトリを束縛した削除関数を公開する
export const createDeleteKanji = (repositories: Repositories): KanjiService['deleteKanji'] => {
  // 呼び出し側へ削除関数を返す
  return deleteKanjiImpl.bind(null, repositories);
};
