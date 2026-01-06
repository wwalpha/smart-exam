import type { ReviewTestTarget } from '@smart-exam/api-types';
import type { ReviewMode, SubjectId } from '@smart-exam/api-types';
import type { ReviewTestTable, WordMasterTable } from '@/types/db';
import { sortTargets, toReviewTargetKey } from './internal';
import { ReviewTestsService } from '@/services';

export const listReviewTestTargets = async (params: {
  mode: ReviewMode;
  fromYmd: string;
  toYmd: string;
  subject?: SubjectId;
}): Promise<ReviewTestTarget[]> => {
  const from = params.fromYmd;
  const to = params.toYmd;

  const rows: ReviewTestTable[] = await ReviewTestsService.scanAll();

  const filteredRows = rows.filter((t) => {
    if (t.mode !== params.mode) return false;
    if (params.subject && String(t.subject) !== String(params.subject)) return false;
    if (t.createdDate < from) return false;
    if (t.createdDate > to) return false;
    return true;
  });

  const byKey = new Map<string, ReviewTestTarget>();

  for (const t of filteredRows) {
    const items = Array.isArray(t.items) ? t.items : [];
    for (const r of items) {
      if (r.targetType !== params.mode) continue;

      const key = toReviewTargetKey(t.subject, r.targetId);
      const current = byKey.get(key);

      const reading = (r as unknown as WordMasterTable & { reading?: string }).reading ?? r.answerText;

      if (!current) {
        byKey.set(key, {
          targetType: r.targetType,
          targetId: r.targetId,
          subject: t.subject,
          displayLabel: r.displayLabel,
          canonicalKey: r.canonicalKey,
          kanji: r.kanji,
          reading,
          materialName: r.materialName,
          materialDate: r.materialDate,
          questionText: r.questionText,
          lastTestCreatedDate: t.createdDate,
          includedCount: 1,
        });
        continue;
      }

      const nextLast = current.lastTestCreatedDate < t.createdDate ? t.createdDate : current.lastTestCreatedDate;

      byKey.set(key, {
        ...current,
        displayLabel: current.displayLabel ?? r.displayLabel,
        canonicalKey: current.canonicalKey ?? r.canonicalKey,
        kanji: current.kanji ?? r.kanji,
        reading: current.reading ?? reading,
        materialName: current.materialName ?? r.materialName,
        materialDate: current.materialDate ?? r.materialDate,
        questionText: current.questionText ?? r.questionText,
        lastTestCreatedDate: nextLast,
        includedCount: (current.includedCount ?? 0) + 1,
      });
    }
  }

  return sortTargets(Array.from(byKey.values()));
};
