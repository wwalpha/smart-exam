import type { Exam } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamTable } from '@/types/db';

import type { ExamsService } from './createExamsService';
import { toApiExam } from './internal';

export const createListExams = (repositories: Repositories): ExamsService['listExams'] => {
  return async (): Promise<Exam[]> => {
    const items: ExamTable[] = await repositories.exams.scanAll();

    // stable ordering: createdDate desc then testId desc
    items.sort((a, b) => {
      if (a.createdDate !== b.createdDate) return a.createdDate < b.createdDate ? 1 : -1;
      return a.testId < b.testId ? 1 : -1;
    });

    return items.map(toApiExam);
  };
};
