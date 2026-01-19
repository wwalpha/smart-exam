export { BedrockRepository } from './bedrock';
export { DashboardRepository } from './dashboard';
export { KanjiRepository } from './kanji';
export { MaterialRepository } from './materials';
export { QuestionRepository } from './questions';
export { ReviewTestRepository } from './reviewTests';

// Backward-compatible I/O facades (to be removed after service DI migration)
export { MaterialsService } from './MaterialsService';
export { QuestionsService } from './QuestionsService';
export { ReviewTestCandidatesService } from './ReviewTestCandidatesService';
export { ReviewTestsService } from './ReviewTestsService';
export { WordMasterService } from './WordMasterService';
export { ReviewTestPdfService } from './ReviewTestPdfService';
