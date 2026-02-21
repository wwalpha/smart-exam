import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { CreateMaterialRequest, CreateMaterialResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';
import { CreateMaterialBodySchema } from './materials.schema';

export const createMaterial =
  (services: Services): AsyncHandler<ParamsDictionary, CreateMaterialResponse, CreateMaterialRequest, ParsedQs> =>
  async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateMaterialBodySchema>;
    const item = await services.materials.createMaterial(body);
    res.status(201).json(item);
  };
