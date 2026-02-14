// Module: createRepositories responsibilities.

import { MaterialsRepository } from '@/repositories/MaterialsRepository';
import { QuestionsRepository } from '@/repositories/QuestionsRepository';
import { ExamCandidatesRepository } from '@/repositories/ExamCandidatesRepository';
import { ExamsRepository } from '@/repositories/ExamsRepository';
import { WordMasterRepository } from '@/repositories/WordMasterRepository';
import { analyzeExamPaper, generateKanjiQuestionReadingsBulk } from '@/repositories/BedrockRepository';
import { S3Repository } from '@/repositories/S3Repository';


/** Type definition for Repositories. */
export type Repositories = {
  materials: typeof MaterialsRepository;
  questions: typeof QuestionsRepository;
  examCandidates: typeof ExamCandidatesRepository;
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
    exams: ExamsRepository,
    wordMaster: WordMasterRepository,
    s3: S3Repository,
    bedrock: { analyzeExamPaper, generateKanjiQuestionReadingsBulk },
  };
};
