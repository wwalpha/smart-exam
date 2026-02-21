import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { ListMaterialFilesParams, ListMaterialFilesResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const listMaterialFiles = (services: Services): AsyncHandler<
  ListMaterialFilesParams,
  ListMaterialFilesResponse,
  Record<string, never>,
  ParsedQs
> => async (req, res) => {
  const { materialId } = req.params;
  const datas = await services.materials.listMaterialFiles(materialId);
  res.json({ datas });
};
