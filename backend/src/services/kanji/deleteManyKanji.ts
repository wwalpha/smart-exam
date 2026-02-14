import type { Repositories } from '@/repositories/createRepositories';
import { logger } from '@/lib/logger';

import type { KanjiService } from './createKanjiService';

// 公開するサービス処理を定義する
export const createDeleteManyKanji = (repositories: Repositories): KanjiService['deleteManyKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (ids): Promise<void> => {
    // 処理で使う値を準備する
    const uniqueIds = Array.from(new Set(ids.map((x) => x.trim()).filter((x) => x.length > 0)));
    const deletedIds: string[] = [];

    // 対象データを順番に処理する
    for (const id of uniqueIds) {
      let existing: Awaited<ReturnType<typeof repositories.wordMaster.get>>;
      // 例外が発生しうる処理を実行する
      try {
        existing = await repositories.wordMaster.get(id);
      } catch (error) {
        // 1件の参照失敗で一括削除全体を失敗させない
        logger.error(`[kanji.deleteManyKanji] failed to load word id=${id}`, error);
        continue;
      }

      // 条件に応じて処理を分岐する
      if (!existing) continue;

      // 例外が発生しうる処理を実行する
      try {
        // 候補テーブルの整合は保つが、ここで失敗しても単語削除は継続する
        await repositories.examCandidates.deleteCandidatesByTargetId({
          subject: existing.subject,
          targetId: id,
        });
      } catch (error) {
        logger.warn(`[kanji.deleteManyKanji] candidate cleanup failed id=${id}`, error);
      }

      // 例外が発生しうる処理を実行する
      try {
        // 非同期処理の完了を待つ
        await repositories.wordMaster.delete(id);
        deletedIds.push(id);
      } catch (error) {
        logger.error(`[kanji.deleteManyKanji] failed to delete word id=${id}`, error);
      }
    }

    // 条件に応じて処理を分岐する
    if (deletedIds.length === 0) return;

    // 処理で使う値を準備する
    const deletedIdSet = new Set(deletedIds);
    let tests: Awaited<ReturnType<typeof repositories.exams.scanAll>>;
    // 例外が発生しうる処理を実行する
    try {
      tests = await repositories.exams.scanAll();
    } catch (error) {
      // テスト側の後処理失敗で 500 を返すと実削除済みデータと整合が崩れるため、ここでは終了する
      logger.warn('[kanji.deleteManyKanji] failed to scan exams while syncing deleted ids', error);
      // 処理結果を呼び出し元へ返す
      return;
    }

    // 処理で使う値を準備する
    const affected = tests.filter(
      (t) =>
        t.mode === 'KANJI' &&
        Array.isArray(t.questions) &&
        t.questions.some((q) => deletedIdSet.has(q)),
    );

    // 非同期で必要な値を取得する
    const results = await Promise.allSettled(
      affected.map(async (t) => {
        // 処理で使う値を準備する
        const nextQuestions = (t.questions ?? []).filter((x) => !deletedIdSet.has(x));
        // 処理で使う値を準備する
        const nextResults = (t.results ?? []).filter((r) => !deletedIdSet.has(r.id));

        // 既存PDFに削除済み漢字が残るのを避けるため、pdfS3Key を削除して再生成ルートに落とす
        const { pdfS3Key: _pdfS3Key, ...rest } = t;
        // 非同期処理の完了を待つ
        await repositories.exams.put({
          ...rest,
          questions: nextQuestions,
          count: nextQuestions.length,
          results: nextResults,
        });
      }),
    );

    results.forEach((result, index) => {
      // 条件に応じて処理を分岐する
      if (result.status === 'rejected') {
        // 処理で使う値を準備する
        const failedTestId = affected[index]?.testId ?? 'unknown';
        logger.warn(`[kanji.deleteManyKanji] failed to sync exam testId=${failedTestId}`, result.reason);
      }
    });
  };
};
