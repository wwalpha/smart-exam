import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { ApiError } from '@/lib/apiError';

type GetMaterialFileParams = {
  materialId: string;
  fileId: string;
};

export const getMaterialFile: AsyncHandler<GetMaterialFileParams, unknown, {}, ParsedQs> = async (req, res) => {
  const { materialId, fileId } = req.params;
  if (!materialId || !fileId) {
    throw new ApiError('materialId and fileId are required', 400, ['invalid_request']);
  }

  const file = await MaterialRepository.getMaterialFile(materialId, fileId);
  if (!file) {
    throw new ApiError('not found', 404, ['not_found']);
  }

  res.status(200);
  res.setHeader('content-type', file.contentType);
  res.setHeader('content-disposition', `inline; filename="${file.filename}"`);
  res.send(file.body);
};
