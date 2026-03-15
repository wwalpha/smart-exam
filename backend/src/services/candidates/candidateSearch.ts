import { EXAM_MODE, type CandidateSearchResult } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable, KanjiTable, MaterialQuestionsTable } from '@/types/db';

import type { CandidatesService } from './candidates.types';

const toMaterialCandidateResult = async (
  repositories: Repositories,
  candidate: ExamCandidateTable,
): Promise<CandidateSearchResult> => {
  const question = await repositories.materialQuestions.get(candidate.questionId);

  return {
    id: candidate.id,
    subject: candidate.subject,
    nextTime: candidate.nextTime,
    mode: EXAM_MODE.MATERIAL,
    questionText: getMaterialCandidateText(question),
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
    nextTime: candidate.nextTime,
    mode: EXAM_MODE.KANJI,
    questionText: getKanjiCandidateText(kanji),
  };
};

const getMaterialCandidateText = (question: MaterialQuestionsTable | null): string => {
  return String(question?.canonicalKey ?? '').trim();
};

const getKanjiCandidateText = (kanji: KanjiTable | null): string => {
  return String(kanji?.question ?? '').trim();
};

export const createCandidateSearch = (repositories: Repositories): CandidatesService['candidateSearch'] => {
  return async (params): Promise<CandidateSearchResult[]> => {
    const candidates = await repositories.examCandidates.listCandidates({
      subject: params.subject,
      mode: params.mode,
      nextTime: params.nextTime,
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