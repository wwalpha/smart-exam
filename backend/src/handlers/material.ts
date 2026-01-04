import { MaterialRepository } from '@/repositories/materialRepository';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  CreateMaterialSetRequest,
  CreateMaterialSetResponse,
  GetMaterialSetParams,
  GetMaterialSetResponse,
  MaterialFile,
  MaterialSetListResponse,
} from '@smart-exam/api-types';

export const listMaterialSets: AsyncHandler<{}, MaterialSetListResponse, {}, ParsedQs> = async (req, res) => {
  // TODO: Parse query params for filtering
  const items = await MaterialRepository.listMaterialSets();
  // Note: api-types defines items, total, cursor. Backend was using datas, total, hasMore.
  // I am mapping to api-types structure now.
  res.json({ items: items, total: items.length });
};

export const createMaterialSet: AsyncHandler<
  {},
  CreateMaterialSetResponse,
  CreateMaterialSetRequest,
  ParsedQs
> = async (req, res) => {
  const item = await MaterialRepository.createMaterialSet(req.body);
  res.status(201).json(item);
};

export const getMaterialSet: AsyncHandler<
  GetMaterialSetParams,
  GetMaterialSetResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { materialSetId } = req.params;
  const item = await MaterialRepository.getMaterialSet(materialSetId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const listMaterialFiles: AsyncHandler<GetMaterialSetParams, MaterialFile[], {}, ParsedQs> = async (req, res) => {
  const { materialSetId } = req.params;
  const items = await MaterialRepository.listMaterialFiles(materialSetId);
  res.json(items);
};
