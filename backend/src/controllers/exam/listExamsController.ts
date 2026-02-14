// Module: listExamsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { Services } from '@/services/createServices';

/** Creates list review tests controller. */
export const listExamsController = (services: Services) => {
  const listExams: AsyncHandler<
    ParamsDictionary,
    { items: unknown[]; total: number },
    Record<string, never>,
    ParsedQs
  > = async (_req, res) => {
    const items = await services.exams.listExams();
    res.json({ items, total: items.length });
  };

  return { listExams };
};
