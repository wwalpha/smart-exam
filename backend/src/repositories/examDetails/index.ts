import { deleteByExamId } from './deleteByExamId';
import { listExamIdsByTargetId } from './listExamIdsByTargetId';
import { listByExamId } from './listByExamId';
import { putMany } from './putMany';
import { updateResults } from './updateResults';

export { putMany, listByExamId, listExamIdsByTargetId, deleteByExamId, updateResults };

export const ExamDetailsRepository = {
  putMany,
  listByExamId,
  listExamIdsByTargetId,
  deleteByExamId,
  updateResults,
};
