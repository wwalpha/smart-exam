import { EXAM_MODE, type CandidateSearchResult } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, KanjiTable, MaterialQuestionsTable, MaterialTable } from '@/types/db';

import type { CandidatesService } from './candidates.types';

const MATERIAL_CANDIDATE_UNIT_LABEL = '問題';
const KANJI_CANDIDATE_UNIT_LABEL = '漢字';

const toMaterialCandidateResult = async (
  repositories: Repositories,
  candidate: ExamCandidateTable,
): Promise<CandidateSearchResult> => {
  const question = await repositories.materialQuestions.get(candidate.questionId);
  const material = await getMaterialIfNeeded(repositories, candidate.materialId);

  return {
    id: candidate.id,
    subject: candidate.subject,
    unit: MATERIAL_CANDIDATE_UNIT_LABEL,
    questionText: getMaterialCandidateText(question),
    sourceMaterialId: candidate.materialId ?? '',
    sourceMaterialName: material?.title ?? '',
  };
};

const toKanjiCandidateResult = async (
  repositories: Repositories,
  candidate: ExamCandidateTable,
): Promise<CandidateSearchResult> => {
  const kanji = await repositories.kanji.get(candidate.questionId);

  return {
    id: candidate.id,
    subject: candidate.subject,
    unit: KANJI_CANDIDATE_UNIT_LABEL,
    questionText: getKanjiCandidateText(kanji),
    sourceMaterialId: '',
    sourceMaterialName: getKanjiCandidateSupplement(kanji),
  };
};

const getMaterialIfNeeded = async (
  repositories: Repositories,
  materialId: string | undefined,
): Promise<MaterialTable | null> => {
  if (!materialId) {
    return null;
  }

  return repositories.materials.get(materialId);
};

const getMaterialCandidateText = (question: MaterialQuestionsTable | null): string => {
  return String(question?.canonicalKey ?? '').trim();
};

const getKanjiCandidateText = (kanji: KanjiTable | null): string => {
  return String(kanji?.question ?? '').trim();
};

const getKanjiCandidateSupplement = (kanji: KanjiTable | null): string => {
  return String(kanji?.answer ?? '').trim();
};

export const createCandidateSearch = (repositories: Repositories): CandidatesService['candidateSearch'] => {
  return async (params): Promise<CandidateSearchResult[]> => {
    const candidates = await repositories.examCandidates.listCandidates({
      subject: params.subject,
      mode: params.mode,
    });

    return Promise.all(
      candidates.map((candidate) => {
        if (candidate.mode === EXAM_MODE.KANJI) {
          return toKanjiCandidateResult(repositories, candidate);
        }

        return toMaterialCandidateResult(repositories, candidate);
      }),
    );
  };
};