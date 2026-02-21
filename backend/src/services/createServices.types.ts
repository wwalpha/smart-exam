import type { BedrockService } from '@/services/bedrock';
import type { DashboardService } from '@/services/dashboard';
import type { ExamAttemptsService } from '@/services/examAttempts';
import type { ExamsService } from '@/services/exam';
import type { KanjiService } from '@/services/kanji';
import type { MaterialDetailsService } from '@/services/materialDetails';
import type { MaterialsService } from '@/services/materials';
import type { QuestionsService } from '@/services/questions';
import type { S3Service } from '@/services/s3';

export type Services = {
  bedrock: BedrockService;
  dashboard: DashboardService;
  kanji: KanjiService;
  materialDetails: MaterialDetailsService;
  materials: MaterialsService;
  questions: QuestionsService;
  examAttempts: ExamAttemptsService;
  reviewAttempts: ExamAttemptsService;
  exams: ExamsService;
  s3: S3Service;
};
