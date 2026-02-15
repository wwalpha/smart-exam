import { listHistoriesByTargetId } from './listHistoriesByTargetId';
import { putHistory } from './putHistory';

export { putHistory, listHistoriesByTargetId };

export const ExamHistoriesRepository = {
  putHistory,
  listHistoriesByTargetId,
};
