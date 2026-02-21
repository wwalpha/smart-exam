import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { Services } from '@/services/createServices';
import { ApiError } from '@/lib/apiError';

type GetMaterialFileParams = {
  materialId: string;
  fileId: string;
};

export const getMaterialFile = (services: Services): AsyncHandler<
  GetMaterialFileParams,
  unknown,
  Record<string, never>,
  ParsedQs
> => async (req, res) => {
  const { materialId, fileId } = req.params;

  const file = await services.materials.getMaterialFile(materialId, fileId);
  if (!file) {
    throw new ApiError('not found', 404, ['not_found']);
  }

  res.status(200);
  res.setHeader('content-type', file.contentType);
  res.setHeader('content-disposition', `inline; filename="${file.filename}"`);
  res.send(file.body);
};
