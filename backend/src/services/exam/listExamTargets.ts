import type { ExamTarget } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable, KanjiTable } from '@/types/db';

import type { ExamsService } from './index';
import { sortTargets, toReviewTargetKey } from './internal';

// 期間内の試験から「どの問題が何回含まれたか」を集計して返す。
const listExamTargetsImpl: ExamsService['listExamTargets'] = async function listExamTargetsImpl(
  this: Repositories,
  params,
): Promise<ExamTarget[]> {
  const repositories = this;
  const from = params.fromYmd;
  const to = params.toYmd;

  const rows: ExamTable[] = await repositories.exams.scanAll();
  // まず mode / subject / date の条件で試験行を絞り込む。
  const filteredRows = rows.filter((t) => {
    if (t.mode !== params.mode) return false;
    if (params.subject && String(t.subject) !== String(params.subject)) return false;
    if (t.createdDate < from) return false;
    if (t.createdDate > to) return false;
    return true;
  });
  const byKey = new Map<string, ExamTarget>();

  // 試験ごとの targetId 一覧を先に引いて、後段で重複問い合わせを減らす。
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
  const allTargetIds = new Set<string>();
  for (const t of filteredRows) {
    for (const id of detailByExamId.get(t.examId) ?? []) allTargetIds.add(id);
  }
  const questionById = new Map<string, { canonicalKey?: string; materialId?: string }>();
  const materialById = new Map<string, { title?: string; materialDate?: string }>();
  const wordById = new Map<string, KanjiTable>();

  // mode ごとに参照するマスタが異なるため、先に必要な情報をまとめてロードする。
  if (params.mode === 'MATERIAL') {
    const qRows = await Promise.all(Array.from(allTargetIds).map((qid) => repositories.materialQuestions.get(qid)));
    for (const q of qRows) {
      if (!q) continue;
      questionById.set(q.questionId, { canonicalKey: q.canonicalKey, materialId: q.materialId });
    }
    const materialIds = Array.from(
      new Set(
        Array.from(questionById.values())
          .map((q) => q.materialId)
          .filter((x): x is string => !!x),
      ),
    );
    const mRows = await Promise.all(materialIds.map((mid) => repositories.materials.get(mid)));
    for (const m of mRows) {
      if (!m) continue;
      materialById.set(m.materialId, { title: m.title, materialDate: m.materialDate });
    }
  } else {
    const wRows = await Promise.all(Array.from(allTargetIds).map((wid) => repositories.kanji.get(wid)));
    for (const w of wRows) {
      if (!w) continue;
      wordById.set(w.wordId, w as KanjiTable);
    }
  }

  // 同一対象(科目+targetId)を1レコードに畳み込み、出題回数や最終出題日を更新する。
  for (const t of filteredRows) {
    for (const targetId of detailByExamId.get(t.examId) ?? []) {
      const key = toReviewTargetKey(t.subject, targetId);
      const current = byKey.get(key);
      const q = questionById.get(targetId);
      const m = q?.materialId ? materialById.get(q.materialId) : undefined;
      const w = wordById.get(targetId);
      const reading = (w as unknown as (KanjiTable & { reading?: string }) | undefined)?.answer;
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
          questionText: params.mode === 'MATERIAL' ? q?.canonicalKey : w?.question,
          lastTestCreatedDate: t.createdDate,
          includedCount: 1,
        });
        continue;
      }
      const nextLast = current.lastTestCreatedDate < t.createdDate ? t.createdDate : current.lastTestCreatedDate;

      byKey.set(key, {
        ...current,
        displayLabel: current.displayLabel ?? q?.canonicalKey,
        canonicalKey: current.canonicalKey ?? q?.canonicalKey,
        kanji: current.kanji ?? w?.question,
        reading: current.reading ?? reading,
        materialName: current.materialName ?? m?.title,
        materialDate: current.materialDate ?? m?.materialDate,
        questionText: current.questionText ?? (params.mode === 'MATERIAL' ? q?.canonicalKey : w?.question),
        lastTestCreatedDate: nextLast,
        includedCount: (current.includedCount ?? 0) + 1,
      });
    }
  }
  return sortTargets(Array.from(byKey.values()));
};

// repositories を this に束縛してサービス関数として公開する。
export const createListExamTargets = (repositories: Repositories): ExamsService['listExamTargets'] => {
  return listExamTargetsImpl.bind(repositories);
};
