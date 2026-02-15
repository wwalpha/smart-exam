import type {
  CreateExamRequest,
  ReviewMode,
  Exam,
  ExamDetail,
  ExamTarget,
  SearchExamsRequest,
  SearchExamsResponse,
  SubjectId,
  SubmitExamResultsRequest,
  UpdateExamStatusRequest,
} from '@smart-exam/api-types';

import type { ExamCandidateTable } from '@/types/db';

export type ExamsService = {
  listExams: () => Promise<Exam[]>;
  searchExams: (params: SearchExamsRequest) => Promise<SearchExamsResponse>;
  createExam: (req: CreateExamRequest) => Promise<Exam>;
  getExam: (testId: string) => Promise<ExamDetail | null>;
  getExamPdfUrl: (testId: string, params?: { download?: boolean }) => Promise<{ url: string } | null>;
  generateExamPdfBuffer: (testId: string, options?: { includeGenerated?: boolean }) => Promise<Buffer | null>;
  updateExamStatus: (testId: string, req: UpdateExamStatusRequest) => Promise<Exam | null>;
  submitExamResults: (testId: string, req: SubmitExamResultsRequest) => Promise<boolean>;
  deleteExam: (testId: string) => Promise<boolean>;
  listExamTargets: (params: {
    mode: ReviewMode;
    fromYmd: string;
    toYmd: string;
    subject?: SubjectId;
  }) => Promise<ExamTarget[]>;
  listExamCandidates: (params: { subject?: SubjectId; mode?: ReviewMode }) => Promise<ExamCandidateTable[]>;
};
