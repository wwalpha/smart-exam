import { deleteByExamId } from './deleteByExamId';
import { listByExamId } from './listByExamId';
import { putMany } from './putMany';

export { putMany, listByExamId, deleteByExamId };

export const ExamDetailsRepository = {
  putMany,
  listByExamId,
  deleteByExamId,
};
