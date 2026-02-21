// Module: examCandidatesController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedQuery } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ListExamCandidatesResponse, ExamMode, SubjectId } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { ListExamCandidatesQuerySchema } from './examCandidates.schema';

/** Creates review test candidates controller. */
export const examCandidatesController = (services: Services) => {
  const listExamCandidates: AsyncHandler<
    ParamsDictionary,
    ListExamCandidatesResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListExamCandidatesQuerySchema>;

    const items = await services.exams.listExamCandidates({
      subject: q.subject as SubjectId | undefined,
      mode: q.mode as ExamMode | undefined,
    });

    res.json({
      items: items.map((x) => ({
        id: x.id,
        subject: x.subject,
        targetId: x.questionId,
        mode: x.mode,
        correctCount: typeof x.correctCount === 'number' ? x.correctCount : 0,
        nextTime: x.nextTime,
        ...(x.examId ? { examId: x.examId } : {}),
      })),
    });
  };

  return {
    ListExamCandidatesQuerySchema,
    listExamCandidates,
  };
};
