import type { Material } from '@smart-exam/api-types';

// 一覧表示の業務順: 算数(4) → 理科(2) → 社会(3)。それ以外は後ろに並べる。
const SUBJECT_ORDER_RANK: Record<string, number> = {
  '4': 0,
  '2': 1,
  '3': 2,
};

const subjectRank = (subject: string): number => {
  return SUBJECT_ORDER_RANK[subject] ?? 99;
};

export const sortMaterialsForList = (items: Material[]): Material[] => {
  return [...items].sort((a, b) => {
    if (a.materialDate !== b.materialDate) {
      return a.materialDate > b.materialDate ? -1 : 1;
    }

    const rankA = subjectRank(a.subject);
    const rankB = subjectRank(b.subject);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (a.subject !== b.subject) {
      return a.subject < b.subject ? -1 : 1;
    }

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
};
