import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { SearchMaterialsRequest, SearchMaterialsResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';
import { SearchMaterialsBodySchema } from './materials.schema';

export const searchMaterials =
  (services: Services): AsyncHandler<ParamsDictionary, SearchMaterialsResponse, SearchMaterialsRequest, ParsedQs> =>
  async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchMaterialsBodySchema>;
    const result = await services.materials.searchMaterials(body);
    res.json(result);
  };
