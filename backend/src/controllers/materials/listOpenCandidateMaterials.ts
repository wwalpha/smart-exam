import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { ListOpenCandidateMaterialsRequest, ListOpenCandidateMaterialsResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

import { ListOpenCandidateMaterialsBodySchema } from './materials.schema';

export const listOpenCandidateMaterials =
  (
    services: Services,
  ): AsyncHandler<ParamsDictionary, ListOpenCandidateMaterialsResponse, ListOpenCandidateMaterialsRequest, ParsedQs> =>
  async (req, res) => {
    const params = (req.validated?.body ?? req.body) as ValidatedBody<typeof ListOpenCandidateMaterialsBodySchema>;

    const items = await services.materials.listOpenCandidateMaterials(params);
    res.json({ items, total: items.length, count: items.length });
  };
