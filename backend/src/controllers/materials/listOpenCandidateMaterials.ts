import type { AsyncHandler } from '@/lib/handler';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { MaterialListResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const listOpenCandidateMaterials = (
  services: Services,
): AsyncHandler<ParamsDictionary, MaterialListResponse, Record<string, never>, ParsedQs> => async (_req, res) => {
  const items = await services.materials.listOpenCandidateMaterials();
  res.json({ items, total: items.length });
};
