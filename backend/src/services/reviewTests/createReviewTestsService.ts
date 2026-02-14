// Module: createReviewTestsService responsibilities.

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

import { createCreateReviewTest } from './createReviewTest';
import { createDeleteReviewTest } from './deleteReviewTest';
import { createGenerateReviewTestPdfBuffer } from './generateReviewTestPdfBuffer';
import { createGetReviewTest } from './getReviewTest';
import { createGetReviewTestPdfUrl } from './getReviewTestPdfUrl';
import { createListReviewTestCandidates } from './listReviewTestCandidates';
import { createListReviewTestTargets } from './listReviewTestTargets';
import { createListReviewTests } from './listReviewTests';
import { createSearchReviewTests } from './searchReviewTests';
import { createSubmitReviewTestResults } from './submitReviewTestResults';
import { createUpdateReviewTestStatus } from './updateReviewTestStatus';

/** Type definition for ReviewTestsService. */
export type ReviewTestsService = {
  listReviewTests: () => Promise<ReviewTest[]>;
  searchReviewTests: (params: SearchReviewTestsRequest) => Promise<SearchReviewTestsResponse>;
  createReviewTest: (req: CreateReviewTestRequest) => Promise<ReviewTest>;
  getReviewTest: (testId: string) => Promise<ReviewTestDetail | null>;
  getReviewTestPdfUrl: (testId: string, params?: { download?: boolean }) => Promise<{ url: string } | null>;
  generateReviewTestPdfBuffer: (testId: string, options?: { includeGenerated?: boolean }) => Promise<Buffer | null>;
  updateReviewTestStatus: (testId: string, req: UpdateReviewTestStatusRequest) => Promise<ReviewTest | null>;
  submitReviewTestResults: (testId: string, req: SubmitReviewTestResultsRequest) => Promise<boolean>;
  deleteReviewTest: (testId: string) => Promise<boolean>;
  listReviewTestTargets: (params: {
    mode: ReviewMode;
    fromYmd: string;
    toYmd: string;
    subject?: SubjectId;
  }) => Promise<ReviewTestTarget[]>;
  listReviewTestCandidates: (params: { subject?: SubjectId; mode?: ReviewMode }) => Promise<ReviewTestCandidateTable[]>;
};

/** Creates review tests service. */
export const createReviewTestsService = (repositories: Repositories): ReviewTestsService => {
  const listReviewTests = createListReviewTests(repositories);
  const searchReviewTests = createSearchReviewTests({ listReviewTests });

  const deleteReviewTest = createDeleteReviewTest(repositories);
  const getReviewTest = createGetReviewTest(repositories);

  const createReviewTest = createCreateReviewTest({ repositories, getReviewTest, deleteReviewTest });

  const listReviewTestTargets = createListReviewTestTargets(repositories);
  const listReviewTestCandidates = createListReviewTestCandidates(repositories);
  const updateReviewTestStatus = createUpdateReviewTestStatus(repositories);
  const submitReviewTestResults = createSubmitReviewTestResults(repositories);

  const getReviewTestPdfUrl = createGetReviewTestPdfUrl({ repositories, getReviewTest });
  const generateReviewTestPdfBuffer = createGenerateReviewTestPdfBuffer({ getReviewTest });

  return {
    listReviewTests,
    searchReviewTests,
    createReviewTest,
    getReviewTest,
    getReviewTestPdfUrl,
    generateReviewTestPdfBuffer,
    updateReviewTestStatus,
    submitReviewTestResults,
    deleteReviewTest,
    listReviewTestTargets,
    listReviewTestCandidates,
  };
};
