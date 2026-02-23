import type { AnalyzeMaterialResponse, SubjectId } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import { createUuid } from '@/lib/uuid';
import type { Repositories } from '@/repositories/createRepositories';
import { toSortNumber } from '@/services/materialQuestions/materialQuestions.lib';
import type { MaterialQuestionsTable } from '@/types/db';

import type { MaterialsService } from './materials.types';

const QUESTION_NUMBER_PATTERN = /^\d+(?:-\d+)*(?:-[^-\s]+)?$/;

const normalizeQuestionNumber = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const replaced = trimmed
    .replace(/[（）()]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');

  if (!QUESTION_NUMBER_PATTERN.test(replaced)) return null;

  const parts = replaced.split('-').filter((p) => p.length > 0);
  const last = parts.at(-1) ?? '';
  if (/^[A-Za-z]$/.test(last)) {
    return [...parts.slice(0, -1), last.toUpperCase()].join('-');
  }

  return parts.join('-');
};

const compareQuestionNumber = (a: string, b: string): number => {
  const aParts = a.split('-').filter((p) => p.length > 0);
  const bParts = b.split('-').filter((p) => p.length > 0);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const av = Number.parseInt(aParts[i] ?? '0', 10);
    const bv = Number.parseInt(bParts[i] ?? '0', 10);
    if (Number.isFinite(av) && Number.isFinite(bv) && av !== bv) {
      return av - bv;
    }

    const as = (aParts[i] ?? '').toUpperCase();
    const bs = (bParts[i] ?? '').toUpperCase();
    if (as !== bs) {
      return as.localeCompare(bs, 'ja');
    }
  }

  return 0;
};

const toDbQuestion = (materialId: string, subjectId: SubjectId, canonicalKey: string): MaterialQuestionsTable => {
  return {
    questionId: createUuid(),
    materialId,
    subjectId,
    number: toSortNumber(canonicalKey),
    canonicalKey,
    choice: undefined,
  };
};

export const createAnalyzeMaterial = async (
  repositories: Repositories,
  materialId: string,
): ReturnType<MaterialsService['analyzeMaterial']> => {
  const material = await repositories.materials.get(materialId);
  if (!material) {
    throw new ApiError('material not found', 404, ['material_not_found']);
  }
  if (material.isCompleted) {
    throw new ApiError('material is completed', 409, ['material_already_completed']);
  }

  const answerSheetPath = String(material.answerSheetPath ?? '').trim();
  if (!answerSheetPath) {
    throw new ApiError('graded answer pdf is required', 400, ['graded_answer_required']);
  }

  const analyzed = await repositories.bedrock.analyzeExamPaper(answerSheetPath, material.subjectId);
  const normalized = analyzed
    .map(normalizeQuestionNumber)
    .filter((value): value is string => typeof value === 'string');
  const questions = Array.from(new Set(normalized)).sort(compareQuestionNumber);

  const analyzedChoices = await repositories.bedrock.analyzeExamPaperChoices(answerSheetPath, questions);
  const choiceByQuestion = new Map<string, 'CORRECT' | 'INCORRECT'>(
    analyzedChoices
      .map((item) => [item.canonicalKey, item.isCorrect ? 'CORRECT' : 'INCORRECT'] as const)
      .filter(([canonicalKey]) => questions.includes(canonicalKey)),
  );

  // 再分析結果で全量置換するため、既存の問題明細を先に全削除する
  const currentDetails = await repositories.materialQuestions.listByMaterialId(materialId);
  await Promise.all(currentDetails.map((detail) => repositories.materialQuestions.delete(detail.questionId)));

  // 問題番号分析の結果を教材明細として再登録する
  await Promise.all(
    questions.map((canonicalKey) => {
      const dbItem = toDbQuestion(materialId, material.subjectId, canonicalKey);
      const choice = choiceByQuestion.get(canonicalKey);
      if (choice) {
        dbItem.choice = choice;
      }
      return repositories.materialQuestions.create(dbItem);
    }),
  );

  await repositories.materials.update(materialId, {
    questionCount: questions.length,
  });

  const response: AnalyzeMaterialResponse = {
    questions,
  };

  return response;
};
