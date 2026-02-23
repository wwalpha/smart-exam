import type { ExamDetail } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import { toApiExam } from './internal';

// 試験本体・明細・マスタを結合して詳細レスポンスを構築する。
export const createGetExam = async (repositories: Repositories, examId: string): Promise<ExamDetail | null> => {
  const test = await repositories.exams.get(examId);
  if (!test) return null;

  const details = await repositories.examDetails.listByExamId(examId);
  const targetIds = details.map((detail) => detail.targetId);

  // isCorrect は exam.results と examDetails の両経路に存在し得るためマージする。
  const resultByTargetId = new Map((test.results ?? []).map((r) => [r.id, r.isCorrect] as const));
  const detailResultByTargetId = new Map(
    details
      .filter((detail) => typeof detail.isCorrect === 'boolean')
      .map((detail) => [detail.targetId, detail.isCorrect as boolean] as const),
  );

  // KANJI は漢字マスタを参照して設問情報を作る。
  if (test.mode === 'KANJI') {
    const words = await Promise.all(targetIds.map((id) => repositories.kanji.get(id)));
    const byId = new Map(
      words.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w.wordId, w] as const),
    );
    return {
      ...toApiExam(test),
      items: targetIds.map((targetId) => {
        const w = byId.get(targetId);
        const isCorrect = detailResultByTargetId.get(targetId) ?? resultByTargetId.get(targetId);
        return {
          id: targetId,
          itemId: targetId,
          examId,
          targetType: 'KANJI',
          targetId,
          kanji: w?.answer,
          reading: w?.readingHiragana,
          questionText: w?.question,
          answerText: w?.answer,
          readingHiragana: w?.readingHiragana,
          underlineSpec: w?.underlineSpec,
          ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
        };
      }),
    };
  }

  // MATERIAL は設問 -> 教材の順に参照して表示情報を補完する。
  const questionRows = await Promise.all(targetIds.map((qid) => repositories.materialQuestions.get(qid)));
  const qById = new Map(
    questionRows.filter((q): q is NonNullable<typeof q> => q !== null).map((q) => [q.questionId, q] as const),
  );
  const materialIds = Array.from(new Set(Array.from(qById.values()).map((q) => q.materialId)));
  const materialRows = await Promise.all(materialIds.map((mid) => repositories.materials.get(mid)));
  const mById = new Map(
    materialRows.filter((m): m is NonNullable<typeof m> => m !== null).map((m) => [m.materialId, m] as const),
  );
  return {
    ...toApiExam(test),
    items: targetIds.map((targetId) => {
      const q = qById.get(targetId);
      const m = q ? mById.get(q.materialId) : undefined;
      const isCorrect = detailResultByTargetId.get(targetId) ?? resultByTargetId.get(targetId);
      return {
        id: targetId,
        itemId: targetId,
        examId,
        targetType: 'MATERIAL',
        targetId,
        displayLabel: q?.canonicalKey,
        canonicalKey: q?.canonicalKey,
        materialId: q?.materialId,
        grade: m?.grade,
        provider: m?.provider,
        materialName: m?.title,
        materialDate: m?.materialDate,
        questionText: q?.canonicalKey,
        answerText: q?.correctAnswer,
        correctAnswer: q?.correctAnswer,
        ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
      };
    }),
  };
};
