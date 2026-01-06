import { createReviewTest } from './createReviewTest';
import { deleteReviewTest } from './deleteReviewTest';
import { getReviewTest } from './getReviewTest';
import { listDueCandidates } from './listDueCandidates';
import { listReviewTests } from './listReviewTests';
import { listReviewTestTargets } from './listReviewTestTargets';
import { putCandidate } from './putCandidate';
import { submitReviewTestResults } from './submitReviewTestResults';
import { updateReviewTestStatus } from './updateReviewTestStatus';

export {
  createReviewTest,
  deleteReviewTest,
  getReviewTest,
  listDueCandidates,
  listReviewTests,
  listReviewTestTargets,
  putCandidate,
  submitReviewTestResults,
  updateReviewTestStatus,
};

export const ReviewTestRepository = {
  putCandidate,
  listDueCandidates,
  listReviewTests,
  listReviewTestTargets,
  createReviewTest,
  getReviewTest,
  updateReviewTestStatus,
  deleteReviewTest,
  submitReviewTestResults,
};
