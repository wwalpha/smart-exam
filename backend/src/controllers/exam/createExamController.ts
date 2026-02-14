// Module: createExamController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { CreateExamRequest, CreateExamResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { CreateExamBodySchema } from './createExamController.schema';

/** Creates create review test controller. */
export const createExamController = (services: Services) => {
  const createExam: AsyncHandler<
    ParamsDictionary,
    CreateExamResponse,
    CreateExamRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateExamBodySchema>;
    const item = await services.exams.createExam(body);
    res.status(201).json(item);
  };

  return { CreateExamBodySchema, createExam };
};
