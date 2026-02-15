import { bulkCreateCandidates } from './bulkCreateCandidates';
import { closeCandidateIfMatch } from './closeCandidateIfMatch';
import { createCandidate } from './createCandidate';
import { deleteCandidate } from './deleteCandidate';
import { deleteCandidatesByTargetId } from './deleteCandidatesByTargetId';
import { deleteLatestOpenCandidateByTargetId } from './deleteLatestOpenCandidateByTargetId';
import { deleteOpenCandidatesByTargetId } from './deleteOpenCandidatesByTargetId';
import { getLatestCandidateByTargetId } from './getLatestCandidateByTargetId';
import { getLatestOpenCandidateByTargetId } from './getLatestOpenCandidateByTargetId';
import { listCandidates } from './listCandidates';
import { listCandidatesByTargetId } from './listCandidatesByTargetId';
import { listDueCandidates } from './listDueCandidates';
import { listLockedCandidatesByExamId } from './listLockedCandidatesByExamId';
import { lockCandidateIfUnlocked } from './lockCandidateIfUnlocked';
import { releaseLockIfMatch } from './releaseLockIfMatch';

export {
  bulkCreateCandidates,
  closeCandidateIfMatch,
  createCandidate,
  deleteCandidate,
  deleteCandidatesByTargetId,
  deleteLatestOpenCandidateByTargetId,
  deleteOpenCandidatesByTargetId,
  getLatestCandidateByTargetId,
  getLatestOpenCandidateByTargetId,
  listCandidates,
  listCandidatesByTargetId,
  listDueCandidates,
  listLockedCandidatesByExamId,
  lockCandidateIfUnlocked,
  releaseLockIfMatch,
};

export const ExamCandidatesRepository = {
  bulkCreateCandidates,
  createCandidate,
  listCandidatesByTargetId,
  deleteCandidatesByTargetId,
  getLatestCandidateByTargetId,
  getLatestOpenCandidateByTargetId,
  deleteCandidate,
  deleteLatestOpenCandidateByTargetId,
  lockCandidateIfUnlocked,
  releaseLockIfMatch,
  closeCandidateIfMatch,
  listDueCandidates,
  listCandidates,
  listLockedCandidatesByExamId,
  deleteOpenCandidatesByTargetId,
};
