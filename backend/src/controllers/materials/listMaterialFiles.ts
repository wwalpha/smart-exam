import { MaterialRepository } from '@/services';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { ListMaterialFilesParams, ListMaterialFilesResponse } from '@smart-exam/api-types';

export const listMaterialFiles: AsyncHandler<
  ListMaterialFilesParams,
  ListMaterialFilesResponse,
  {},
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const items = await MaterialRepository.listMaterialFiles(materialId);
  res.json({ datas: items });
};
