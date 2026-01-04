import type { Request, Response } from 'express';
import { MaterialRepository } from '@/repositories/materialRepository';
import { apiHandler } from '@/lib/handler';
import type {
  CreateMaterialSetRequest,
  CreateMaterialSetResponse,
  GetMaterialSetResponse,
  MaterialSetListResponse,
} from '@smart-exam/api-types';

type ListMaterialSetsReq = Request<{}, MaterialSetListResponse, {}, {}>;
type ListMaterialSetsRes = Response<MaterialSetListResponse>;

type CreateMaterialSetReq = Request<{}, CreateMaterialSetResponse, CreateMaterialSetRequest>;
type CreateMaterialSetRes = Response<CreateMaterialSetResponse>;

type GetMaterialSetReq = Request<{ materialSetId: string }, GetMaterialSetResponse | { error: string }, {}, {}>;
type GetMaterialSetRes = Response<GetMaterialSetResponse | { error: string }>;

export const listMaterialSets = apiHandler(async (req: ListMaterialSetsReq, res: ListMaterialSetsRes) => {
  // TODO: Parse query params for filtering
  const items = await MaterialRepository.listMaterialSets();
  // Note: api-types defines items, total, cursor. Backend was using datas, total, hasMore.
  // I am mapping to api-types structure now.
  res.json({ items: items, total: items.length });
});

export const createMaterialSet = apiHandler(async (req: CreateMaterialSetReq, res: CreateMaterialSetRes) => {
  const item = await MaterialRepository.createMaterialSet(req.body);
  res.status(201).json(item);
});

export const getMaterialSet = apiHandler(async (req: GetMaterialSetReq, res: GetMaterialSetRes) => {
  const { materialSetId } = req.params;
  const item = await MaterialRepository.getMaterialSet(materialSetId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
});
