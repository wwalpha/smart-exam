import { deleteByExamId } from './deleteByExamId';
import { listExamIdsByTargetId } from './listExamIdsByTargetId';
import { listByExamId } from './listByExamId';
import { putMany } from './putMany';
import { updateResults } from './updateResults';
import { countCompletedMaterialReviews } from './countCompletedMaterialReviews';

export { putMany, listByExamId, listExamIdsByTargetId, deleteByExamId, updateResults, countCompletedMaterialReviews };

export const ExamDetailsRepository = {
  putMany,
  listByExamId,
  listExamIdsByTargetId,
  deleteByExamId,
  updateResults,
  countCompletedMaterialReviews,
};
