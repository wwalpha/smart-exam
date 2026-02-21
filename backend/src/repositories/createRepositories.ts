// Module: createRepositories responsibilities.

import { MaterialsRepository } from '@/repositories/materials';
import { QuestionsRepository } from '@/repositories/questions';
import { ExamCandidatesRepository } from '@/repositories/examCandidates';
import { ExamDetailsRepository } from '@/repositories/examDetails';
import { ExamHistoriesRepository } from '@/repositories/examHistories';
import { ExamsRepository } from '@/repositories/exams';
import { KanjiRepository } from '@/repositories/kanji';
import { analyzeExamPaper, generateKanjiQuestionReadingsBulk } from '@/repositories/BedrockRepository';
import { S3Repository } from '@/repositories/s3';

/** Type definition for Repositories. */
export type Repositories = {
  materials: typeof MaterialsRepository;
  questions: typeof QuestionsRepository;
  examCandidates: typeof ExamCandidatesRepository;
  examDetails: typeof ExamDetailsRepository;
  examHistories: typeof ExamHistoriesRepository;
  exams: typeof ExamsRepository;
  kanji: typeof KanjiRepository;
  s3: typeof S3Repository;
  bedrock: {
    analyzeExamPaper: typeof analyzeExamPaper;
    generateKanjiQuestionReadingsBulk: typeof generateKanjiQuestionReadingsBulk;
  };
};

/** Creates repositories. */
export const createRepositories = (): Repositories => {
  return {
    materials: MaterialsRepository,
    questions: QuestionsRepository,
    examCandidates: ExamCandidatesRepository,
    examDetails: ExamDetailsRepository,
    examHistories: ExamHistoriesRepository,
    exams: ExamsRepository,
    kanji: KanjiRepository,
    s3: S3Repository,
    bedrock: { analyzeExamPaper, generateKanjiQuestionReadingsBulk },
  };
};
