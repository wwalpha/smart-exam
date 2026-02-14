// Module: createRepositories responsibilities.

import { MaterialsRepository } from '@/repositories/MaterialsRepository';
import { QuestionsRepository } from '@/repositories/QuestionsRepository';
import { ReviewTestCandidatesRepository } from '@/repositories/ReviewTestCandidatesRepository';
import { ReviewTestsRepository } from '@/repositories/ReviewTestsRepository';
import { WordMasterRepository } from '@/repositories/WordMasterRepository';
import { analyzeExamPaper, generateKanjiQuestionReading, generateKanjiQuestionReadingsBulk } from '@/repositories/BedrockRepository';
import { S3Repository } from '@/repositories/S3Repository';


/** Type definition for Repositories. */
export type Repositories = {
  materials: typeof MaterialsRepository;
  questions: typeof QuestionsRepository;
  reviewTestCandidates: typeof ReviewTestCandidatesRepository;
  reviewTests: typeof ReviewTestsRepository;
  wordMaster: typeof WordMasterRepository;
  s3: typeof S3Repository;
  bedrock: {
    analyzeExamPaper: typeof analyzeExamPaper;
    generateKanjiQuestionReading: typeof generateKanjiQuestionReading;
    generateKanjiQuestionReadingsBulk: typeof generateKanjiQuestionReadingsBulk;
  };
};

/** Creates repositories. */
export const createRepositories = (): Repositories => {
  return {
    materials: MaterialsRepository,
    questions: QuestionsRepository,
    reviewTestCandidates: ReviewTestCandidatesRepository,
    reviewTests: ReviewTestsRepository,
    wordMaster: WordMasterRepository,
    s3: S3Repository,
    bedrock: { analyzeExamPaper, generateKanjiQuestionReading, generateKanjiQuestionReadingsBulk },
  };
};
