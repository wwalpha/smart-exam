import type { BedrockService } from '@/services/bedrock';
import type { CandidatesService } from '@/services/candidates';
import type { DashboardService } from '@/services/dashboard';
import type { ExamsService } from '@/services/exam';
import type { KanjiService } from '@/services/kanji';
import type { MaterialQuestionsService } from '@/services/materialQuestions';
import type { MaterialsService } from '@/services/materials';

export type Services = {
  bedrock: BedrockService;
  candidates: CandidatesService;
  dashboard: DashboardService;
  kanji: KanjiService;
  materialQuestions: MaterialQuestionsService;
  materials: MaterialsService;
  exams: ExamsService;
};
