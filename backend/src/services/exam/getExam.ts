import type { ExamDetail } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';
import { toApiExam } from './internal';

// 内部で利用する補助処理を定義する
const getExamImpl = async (repositories: Repositories, examId: string): Promise<ExamDetail | null> => {
  // 非同期で必要な値を取得する
  const test = await repositories.exams.get(examId);
  // 条件に応じて処理を分岐する
  if (!test) return null;

  const details = await repositories.examDetails.listByExamId(examId);
  const targetIds = details.map((detail) => detail.targetId);

  // 処理で使う値を準備する
  const resultByTargetId = new Map((test.results ?? []).map((r) => [r.id, r.isCorrect] as const));

  // 条件に応じて処理を分岐する
  if (test.mode === 'KANJI') {
    // 非同期で必要な値を取得する
    const words = await Promise.all(targetIds.map((id) => repositories.kanji.get(id)));
    // 処理で使う値を準備する
    const byId = new Map(
      words.filter((w): w is NonNullable<typeof w> => w !== null).map((w) => [w.wordId, w] as const),
    );

    // 処理結果を呼び出し元へ返す
    return {
      ...toApiExam(test),
      items: targetIds.map((targetId) => {
        // 処理で使う値を準備する
        const w = byId.get(targetId);
        // 処理で使う値を準備する
        const isCorrect = resultByTargetId.get(targetId);
        // 処理結果を呼び出し元へ返す
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

  // 非同期で必要な値を取得する
  const questionRows = await Promise.all(targetIds.map((qid) => repositories.materialQuestions.get(qid)));
  // 処理で使う値を準備する
  const qById = new Map(
    questionRows.filter((q): q is NonNullable<typeof q> => q !== null).map((q) => [q.questionId, q] as const),
  );

  // 処理で使う値を準備する
  const materialIds = Array.from(new Set(Array.from(qById.values()).map((q) => q.materialId)));
  // 非同期で必要な値を取得する
  const materialRows = await Promise.all(materialIds.map((mid) => repositories.materials.get(mid)));
  // 処理で使う値を準備する
  const mById = new Map(
    materialRows.filter((m): m is NonNullable<typeof m> => m !== null).map((m) => [m.materialId, m] as const),
  );

  // 処理結果を呼び出し元へ返す
  return {
    ...toApiExam(test),
    items: targetIds.map((targetId) => {
      // 処理で使う値を準備する
      const q = qById.get(targetId);
      // 処理で使う値を準備する
      const m = q ? mById.get(q.materialId) : undefined;
      // 処理で使う値を準備する
      const isCorrect = resultByTargetId.get(targetId);

      // 処理結果を呼び出し元へ返す
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
        ...(typeof isCorrect === 'boolean' ? { isCorrect } : {}),
      };
    }),
  };
};

// 公開するサービス処理を定義する
export const createGetExam = (repositories: Repositories): ExamsService['getExam'] => {
  // 処理結果を呼び出し元へ返す
  return getExamImpl.bind(null, repositories);
};
