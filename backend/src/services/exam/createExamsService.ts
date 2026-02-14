// Module: createExamsService responsibilities.

import type {
  CreateReviewTestRequest,
  ReviewMode,
  ReviewTest,
  ReviewTestDetail,
  ReviewTestTarget,
  SearchReviewTestsRequest,
  SearchReviewTestsResponse,
  SubjectId,
  SubmitReviewTestResultsRequest,
  UpdateReviewTestStatusRequest,
} from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ReviewTestCandidateTable } from '@/types/db';

import { createCreateReviewTest } from './createExam';
import { createDeleteReviewTest } from './deleteExam';
import { createGenerateReviewTestPdfBuffer } from './generateExamPdfBuffer';
import { createGetReviewTest } from './getExam';
import { createGetReviewTestPdfUrl } from './getExamPdfUrl';
import { createListReviewTestCandidates } from './listExamCandidates';
import { createListReviewTestTargets } from './listExamTargets';
import { createListReviewTests } from './listExams';
import { createSearchReviewTests } from './searchExams';
import { createSubmitReviewTestResults } from './submitExamResults';
import { createUpdateReviewTestStatus } from './updateExamStatus';

/** Type definition for ReviewTestsService. */
export type ReviewTestsService = {
  listExams: () => Promise<ReviewTest[]>;
  searchExams: (params: SearchReviewTestsRequest) => Promise<SearchReviewTestsResponse>;
  createExam: (req: CreateReviewTestRequest) => Promise<ReviewTest>;
  getExam: (testId: string) => Promise<ReviewTestDetail | null>;
  getExamPdfUrl: (testId: string, params?: { download?: boolean }) => Promise<{ url: string } | null>;
  generateExamPdfBuffer: (testId: string, options?: { includeGenerated?: boolean }) => Promise<Buffer | null>;
  updateExamStatus: (testId: string, req: UpdateReviewTestStatusRequest) => Promise<ReviewTest | null>;
  submitExamResults: (testId: string, req: SubmitReviewTestResultsRequest) => Promise<boolean>;
  deleteExam: (testId: string) => Promise<boolean>;
  listExamTargets: (params: {
    mode: ReviewMode;
    fromYmd: string;
    toYmd: string;
    subject?: SubjectId;
  }) => Promise<ReviewTestTarget[]>;
  listExamCandidates: (params: { subject?: SubjectId; mode?: ReviewMode }) => Promise<ReviewTestCandidateTable[]>;
};

/** Creates review tests service. */
export const createExamsService = (repositories: Repositories): ReviewTestsService => {
  const listExams = createListReviewTests(repositories);
  const searchExams = createSearchReviewTests({ listExams });

  const deleteExam = createDeleteReviewTest(repositories);
  const getExam = createGetReviewTest(repositories);

  const createExam = createCreateReviewTest({ repositories, getExam, deleteExam });

  const listExamTargets = createListReviewTestTargets(repositories);
  const listExamCandidates = createListReviewTestCandidates(repositories);
  const updateExamStatus = createUpdateReviewTestStatus(repositories);
  const submitExamResults = createSubmitReviewTestResults(repositories);

  const getExamPdfUrl = createGetReviewTestPdfUrl({ repositories, getExam });
  const generateExamPdfBuffer = createGenerateReviewTestPdfBuffer({ getExam });

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
