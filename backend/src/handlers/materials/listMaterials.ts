import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { MaterialListResponse } from '@smart-exam/api-types';

export const listMaterials: AsyncHandler<{}, MaterialListResponse, {}, ParsedQs> = async (_req, res) => {
  const items = await MaterialRepository.listMaterials();
  res.json({ items, total: items.length });
};
