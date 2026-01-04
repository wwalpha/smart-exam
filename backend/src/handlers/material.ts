import { Request, Response } from 'express';
import { MaterialRepository } from '@/repositories/materialRepository';
import { apiHandler } from '@/lib/handler';
import { CreateMaterialSetRequest, MaterialSet, MaterialSetListResponse } from '@smart-exam/api-types';

type ListMaterialSetsRequest = Request<{}, MaterialSetListResponse, {}, {}>;
type CreateMaterialSetReq = Request<{}, MaterialSet, CreateMaterialSetRequest>;
type GetMaterialSetRequest = Request<{ materialSetId: string }, MaterialSet | { error: string }, {}, {}>;

export const listMaterialSets = apiHandler(
  async (req: ListMaterialSetsRequest, res: Response<MaterialSetListResponse>) => {
    // TODO: Parse query params for filtering
    const items = await MaterialRepository.listMaterialSets();
    // Note: api-types defines items, total, cursor. Backend was using datas, total, hasMore.
    // I am mapping to api-types structure now.
    res.json({ items: items, total: items.length });
  }
);

export const createMaterialSet = apiHandler(async (req: CreateMaterialSetReq, res: Response<MaterialSet>) => {
  const item = await MaterialRepository.createMaterialSet(req.body);
  res.status(201).json(item);
});

export const getMaterialSet = apiHandler(
  async (req: GetMaterialSetRequest, res: Response<MaterialSet | { error: string }>) => {
    const { materialSetId } = req.params;
    const item = await MaterialRepository.getMaterialSet(materialSetId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  }
);
