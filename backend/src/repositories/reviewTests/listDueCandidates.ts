import { DateUtils } from '@/lib/dateUtils';
import type { ReviewMode, SubjectId } from '@smart-exam/api-types';
import type { ReviewTestCandidateTable } from '@/types/db';
import { ReviewTestCandidatesService } from '@/services/ReviewTestCandidatesService';

export const listDueCandidates = async (params: {
  subject: SubjectId;
  mode?: ReviewMode;
  todayYmd?: string;
}): Promise<ReviewTestCandidateTable[]> => {
  const today = params.todayYmd ?? DateUtils.todayYmd();

  return ReviewTestCandidatesService.listDueCandidates({
    subject: params.subject,
    mode: params.mode,
    todayYmd: today,
  });
};
