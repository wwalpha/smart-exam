// Module: createRepositories responsibilities.

import { MaterialsRepository } from '@/repositories/materials';
import { MaterialQuestionsRepository } from '@/repositories/materialQuestions';
import { ExamCandidatesRepository } from '@/repositories/examCandidates';
import { ExamDetailsRepository } from '@/repositories/examDetails';
import { ExamHistoriesRepository } from '@/repositories/examHistories';
import { ExamsRepository } from '@/repositories/exams';
import { KanjiRepository } from '@/repositories/kanji';
import {
  analyzeExamPaper,
  analyzeExamPaperChoices,
  generateKanjiQuestionReadingsBulk,
} from '@/repositories/BedrockRepository';
import { S3Repository } from '@/repositories/s3';

/** Type definition for Repositories. */
export type Repositories = {
  materials: typeof MaterialsRepository;
  materialQuestions: typeof MaterialQuestionsRepository;
  examCandidates: typeof ExamCandidatesRepository;
  examDetails: typeof ExamDetailsRepository;
  examHistories: typeof ExamHistoriesRepository;
  exams: typeof ExamsRepository;
  kanji: typeof KanjiRepository;
  s3: typeof S3Repository;
  bedrock: {
    analyzeExamPaper: typeof analyzeExamPaper;
    analyzeExamPaperChoices: typeof analyzeExamPaperChoices;
    generateKanjiQuestionReadingsBulk: typeof generateKanjiQuestionReadingsBulk;
  };
};

/** Creates repositories. */
export const createRepositories = (): Repositories => {
  return {
    materials: MaterialsRepository,
    materialQuestions: MaterialQuestionsRepository,
    examCandidates: ExamCandidatesRepository,
    examDetails: ExamDetailsRepository,
    examHistories: ExamHistoriesRepository,
    exams: ExamsRepository,
    kanji: KanjiRepository,
    s3: S3Repository,
    bedrock: { analyzeExamPaper, analyzeExamPaperChoices, generateKanjiQuestionReadingsBulk },
  };
};
