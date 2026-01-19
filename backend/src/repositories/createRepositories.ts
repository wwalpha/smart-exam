import { MaterialsRepository } from '@/repositories/MaterialsRepository';
import { QuestionsRepository } from '@/repositories/QuestionsRepository';
import { ReviewTestCandidatesRepository } from '@/repositories/ReviewTestCandidatesRepository';
import { ReviewTestsRepository } from '@/repositories/ReviewTestsRepository';
import { WordMasterRepository } from '@/repositories/WordMasterRepository';
import { analyzeExamPaper } from '@/repositories/BedrockRepository';
import { ReviewTestPdfService } from '@/repositories/ReviewTestPdfService';

export type Repositories = {
  materials: typeof MaterialsRepository;
  questions: typeof QuestionsRepository;
  reviewTestCandidates: typeof ReviewTestCandidatesRepository;
  reviewTests: typeof ReviewTestsRepository;
  wordMaster: typeof WordMasterRepository;
  bedrock: {
    analyzeExamPaper: typeof analyzeExamPaper;
  };
  reviewTestPdf: typeof ReviewTestPdfService;
};

export const createRepositories = (): Repositories => {
  return {
    materials: MaterialsRepository,
    questions: QuestionsRepository,
    reviewTestCandidates: ReviewTestCandidatesRepository,
    reviewTests: ReviewTestsRepository,
    wordMaster: WordMasterRepository,
    bedrock: { analyzeExamPaper },
    reviewTestPdf: ReviewTestPdfService,
  };
};
