import type { ExamTarget } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable, KanjiTable } from '@/types/db';

import type { ExamsService } from './index';
import { sortTargets, toReviewTargetKey } from './internal';

const listExamTargetsImpl: ExamsService['listExamTargets'] = async function listExamTargetsImpl(
  this: Repositories,
  params,
): Promise<ExamTarget[]> {
  // 処理で使う値を準備する
  const repositories = this;
  // 処理で使う値を準備する
  const from = params.fromYmd;
  // 処理で使う値を準備する
  const to = params.toYmd;

  const rows: ExamTable[] = await repositories.exams.scanAll();

  // 処理で使う値を準備する
  const filteredRows = rows.filter((t) => {
    // 条件に応じて処理を分岐する
    if (t.mode !== params.mode) return false;
    // 条件に応じて処理を分岐する
    if (params.subject && String(t.subject) !== String(params.subject)) return false;
    // 条件に応じて処理を分岐する
    if (t.createdDate < from) return false;
    // 条件に応じて処理を分岐する
    if (t.createdDate > to) return false;
    // 処理結果を呼び出し元へ返す
    return true;
  });

  // 処理で使う値を準備する
  const byKey = new Map<string, ExamTarget>();

  const detailByExamId = new Map<string, string[]>();
  await Promise.all(
    filteredRows.map(async (test) => {
      const details = await repositories.examDetails.listByExamId(test.examId);
      detailByExamId.set(
        test.examId,
        details.map((detail) => detail.targetId),
      );
    }),
  );

  // 処理で使う値を準備する
  const allTargetIds = new Set<string>();
  // 対象データを順番に処理する
  for (const t of filteredRows) {
    // 対象データを順番に処理する
    for (const id of detailByExamId.get(t.examId) ?? []) allTargetIds.add(id);
  }

  // 処理で使う値を準備する
  const questionById = new Map<string, { canonicalKey?: string; materialId?: string }>();
  // 処理で使う値を準備する
  const materialById = new Map<string, { title?: string; materialDate?: string }>();
  // 処理で使う値を準備する
  const wordById = new Map<string, KanjiTable>();

  // 条件に応じて処理を分岐する
  if (params.mode === 'QUESTION') {
    // 非同期で必要な値を取得する
    const qRows = await Promise.all(Array.from(allTargetIds).map((qid) => repositories.questions.get(qid)));
    // 対象データを順番に処理する
    for (const q of qRows) {
      // 条件に応じて処理を分岐する
      if (!q) continue;
      questionById.set(q.questionId, { canonicalKey: q.canonicalKey, materialId: q.materialId });
    }

    // 処理で使う値を準備する
    const materialIds = Array.from(
      new Set(
        Array.from(questionById.values())
          .map((q) => q.materialId)
          .filter((x): x is string => !!x),
      ),
    );
    // 非同期で必要な値を取得する
    const mRows = await Promise.all(materialIds.map((mid) => repositories.materials.get(mid)));
    // 対象データを順番に処理する
    for (const m of mRows) {
      // 条件に応じて処理を分岐する
      if (!m) continue;
      materialById.set(m.materialId, { title: m.title, materialDate: m.materialDate });
    }
  } else {
    // 非同期で必要な値を取得する
    const wRows = await Promise.all(Array.from(allTargetIds).map((wid) => repositories.kanji.get(wid)));
    // 対象データを順番に処理する
    for (const w of wRows) {
      // 条件に応じて処理を分岐する
      if (!w) continue;
      wordById.set(w.wordId, w as KanjiTable);
    }
  }

  // 対象データを順番に処理する
  for (const t of filteredRows) {
    // 対象データを順番に処理する
    for (const targetId of detailByExamId.get(t.examId) ?? []) {
      // 処理で使う値を準備する
      const key = toReviewTargetKey(t.subject, targetId);
      // 処理で使う値を準備する
      const current = byKey.get(key);

      // 処理で使う値を準備する
      const q = questionById.get(targetId);
      // 処理で使う値を準備する
      const m = q?.materialId ? materialById.get(q.materialId) : undefined;
      // 処理で使う値を準備する
      const w = wordById.get(targetId);
      // 処理で使う値を準備する
      const reading = (w as unknown as (KanjiTable & { reading?: string }) | undefined)?.answer;

      // 条件に応じて処理を分岐する
      if (!current) {
        byKey.set(key, {
          targetType: params.mode,
          targetId,
          subject: t.subject,
          displayLabel: q?.canonicalKey,
          canonicalKey: q?.canonicalKey,
          kanji: w?.question,
          reading,
          materialName: m?.title,
          materialDate: m?.materialDate,
          questionText: params.mode === 'QUESTION' ? q?.canonicalKey : w?.question,
          lastTestCreatedDate: t.createdDate,
          includedCount: 1,
        });
        continue;
      }

      // 処理で使う値を準備する
      const nextLast = current.lastTestCreatedDate < t.createdDate ? t.createdDate : current.lastTestCreatedDate;

      byKey.set(key, {
        ...current,
        displayLabel: current.displayLabel ?? q?.canonicalKey,
        canonicalKey: current.canonicalKey ?? q?.canonicalKey,
        kanji: current.kanji ?? w?.question,
        reading: current.reading ?? reading,
        materialName: current.materialName ?? m?.title,
        materialDate: current.materialDate ?? m?.materialDate,
        questionText: current.questionText ?? (params.mode === 'QUESTION' ? q?.canonicalKey : w?.question),
        lastTestCreatedDate: nextLast,
        includedCount: (current.includedCount ?? 0) + 1,
      });
    }
  }

  // 処理結果を呼び出し元へ返す
  return sortTargets(Array.from(byKey.values()));
};

// 公開するサービス処理を定義する
export const createListExamTargets = (repositories: Repositories): ExamsService['listExamTargets'] => {
  // 処理結果を呼び出し元へ返す
  return listExamTargetsImpl.bind(repositories);
};
