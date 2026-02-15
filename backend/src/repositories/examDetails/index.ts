import { deleteByExamId } from './deleteByExamId';
import { listExamIdsByTargetId } from './listExamIdsByTargetId';
import { listByExamId } from './listByExamId';
import { putMany } from './putMany';

export { putMany, listByExamId, listExamIdsByTargetId, deleteByExamId };

export const ExamDetailsRepository = {
  putMany,
  listByExamId,
  listExamIdsByTargetId,
  deleteByExamId,
};
