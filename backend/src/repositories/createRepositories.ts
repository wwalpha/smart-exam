// Module: createRepositories responsibilities.

import { MaterialsRepository } from '@/repositories/materials';
import { QuestionsRepository } from '@/repositories/questions';
import { ExamCandidatesRepository } from '@/repositories/examCandidates';
import { ExamDetailsRepository } from '@/repositories/examDetails';
import { ExamsRepository } from '@/repositories/exams';
import { WordMasterRepository } from '@/repositories/wordMaster';
import { analyzeExamPaper, generateKanjiQuestionReadingsBulk } from '@/repositories/BedrockRepository';
import { S3Repository } from '@/repositories/s3';

/** Type definition for Repositories. */
export type Repositories = {
  materials: typeof MaterialsRepository;
  questions: typeof QuestionsRepository;
  examCandidates: typeof ExamCandidatesRepository;
  examDetails: typeof ExamDetailsRepository;
  exams: typeof ExamsRepository;
  wordMaster: typeof WordMasterRepository;
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
    exams: ExamsRepository,
    wordMaster: WordMasterRepository,
    s3: S3Repository,
    bedrock: { analyzeExamPaper, generateKanjiQuestionReadingsBulk },
  };
};
