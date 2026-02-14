import type { Repositories } from '@/repositories/createRepositories';

import type { KanjiService } from './createKanjiService';

// 公開するサービス処理を定義する
export const createDeleteKanji = (repositories: Repositories): KanjiService['deleteKanji'] => {
  // 処理結果を呼び出し元へ返す
  return async (id): Promise<boolean> => {
    // 非同期で必要な値を取得する
    const existing = await repositories.wordMaster.get(id);
    // 条件に応じて処理を分岐する
    if (!existing) return false;

    // 非同期処理の完了を待つ
    await repositories.examCandidates.deleteCandidatesByTargetId({ subject: existing.subject, targetId: id });

    // 非同期で必要な値を取得する
    const tests = await repositories.exams.scanAll();
    // 処理で使う値を準備する
    const affected = tests.filter((t) => t.mode === 'KANJI' && Array.isArray(t.questions) && t.questions.includes(id));

    // 非同期処理の完了を待つ
    await Promise.all(
      affected.map(async (t) => {
        // 処理で使う値を準備する
        const nextQuestions = (t.questions ?? []).filter((x) => x !== id);
        // 処理で使う値を準備する
        const nextResults = (t.results ?? []).filter((r) => r.id !== id);

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

    // 非同期処理の完了を待つ
    await repositories.wordMaster.delete(id);
    // 処理結果を呼び出し元へ返す
    return true;
  };
};
