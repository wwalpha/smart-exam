import type { ExamTarget, ReviewMode, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable, WordMasterTable } from '@/types/db';

import type { ExamsService } from './createExamsService';
import { sortTargets, toReviewTargetKey } from './internal';

export const createListExamTargets = (
  repositories: Repositories,
): ExamsService['listExamTargets'] => {
  return async (params: {
    mode: ReviewMode;
    fromYmd: string;
    toYmd: string;
    subject?: SubjectId;
  }): Promise<ExamTarget[]> => {
    const from = params.fromYmd;
    const to = params.toYmd;

    const rows: ExamTable[] = await repositories.exams.scanAll();

    const filteredRows = rows.filter((t) => {
      if (t.mode !== params.mode) return false;
      if (params.subject && String(t.subject) !== String(params.subject)) return false;
      if (t.createdDate < from) return false;
      if (t.createdDate > to) return false;
      return true;
    });

    const byKey = new Map<string, ExamTarget>();

    const allTargetIds = new Set<string>();
    for (const t of filteredRows) {
      for (const id of t.questions ?? []) allTargetIds.add(id);
    }

    const questionById = new Map<string, { canonicalKey?: string; materialId?: string }>();
    const materialById = new Map<string, { title?: string; materialDate?: string }>();
    const wordById = new Map<string, WordMasterTable>();

    if (params.mode === 'QUESTION') {
      const qRows = await Promise.all(Array.from(allTargetIds).map((qid) => repositories.questions.get(qid)));
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
      const wRows = await Promise.all(Array.from(allTargetIds).map((wid) => repositories.wordMaster.get(wid)));
      for (const w of wRows) {
        if (!w) continue;
        wordById.set(w.wordId, w as WordMasterTable);
      }
    }

    for (const t of filteredRows) {
      for (const targetId of t.questions ?? []) {
        const key = toReviewTargetKey(t.subject, targetId);
        const current = byKey.get(key);

        const q = questionById.get(targetId);
        const m = q?.materialId ? materialById.get(q.materialId) : undefined;
        const w = wordById.get(targetId);
        const reading = (w as unknown as (WordMasterTable & { reading?: string }) | undefined)?.answer;

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

    return sortTargets(Array.from(byKey.values()));
  };
};
