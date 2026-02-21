import type { BedrockService } from '@/services/bedrock';
import type { DashboardService } from '@/services/dashboard';
import type { ExamAttemptsService } from '@/services/examAttempts';
import type { ExamsService } from '@/services/exam';
import type { KanjiService } from '@/services/kanji';
import type { MaterialQuestionsService } from '@/services/materialQuestions';
import type { MaterialsService } from '@/services/materials';
import type { S3Service } from '@/services/s3';

export type Services = {
  bedrock: BedrockService;
  dashboard: DashboardService;
  kanji: KanjiService;
  materialQuestions: MaterialQuestionsService;
  materials: MaterialsService;
  examAttempts: ExamAttemptsService;
  reviewAttempts: ExamAttemptsService;
  exams: ExamsService;
  s3: S3Service;
};
