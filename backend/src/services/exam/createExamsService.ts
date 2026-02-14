// Module: createExamsService responsibilities.

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

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamCandidateTable } from '@/types/db';

import { createCreateExam } from './createExam';
import { createDeleteExam } from './deleteExam';
import { createGenerateExamPdfBuffer } from './generateExamPdfBuffer';
import { createGetExam } from './getExam';
import { createGetExamPdfUrl } from './getExamPdfUrl';
import { createListExamCandidates } from './listExamCandidates';
import { createListExamTargets } from './listExamTargets';
import { createListExams } from './listExams';
import { createSearchExams } from './searchExams';
import { createSubmitExamResults } from './submitExamResults';
import { createUpdateExamStatus } from './updateExamStatus';

/** Type definition for ExamsService. */
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

/** Creates review tests service. */
export const createExamsService = (repositories: Repositories): ExamsService => {
  const listExams = createListExams(repositories);
  const searchExams = createSearchExams({ listExams });

  const deleteExam = createDeleteExam(repositories);
  const getExam = createGetExam(repositories);

  const createExam = createCreateExam({ repositories, getExam, deleteExam });

  const listExamTargets = createListExamTargets(repositories);
  const listExamCandidates = createListExamCandidates(repositories);
  const updateExamStatus = createUpdateExamStatus(repositories);
  const submitExamResults = createSubmitExamResults(repositories);

  const getExamPdfUrl = createGetExamPdfUrl({ repositories, getExam });
  const generateExamPdfBuffer = createGenerateExamPdfBuffer({ getExam });

  return {
    listExams,
    searchExams,
    createExam,
    getExam,
    getExamPdfUrl,
    generateExamPdfBuffer,
    updateExamStatus,
    submitExamResults,
    deleteExam,
    listExamTargets,
    listExamCandidates,
  };
};
