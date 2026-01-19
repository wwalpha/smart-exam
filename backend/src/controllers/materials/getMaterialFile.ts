import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { ApiError } from '@/lib/apiError';
import { MaterialRepository } from '@/services';

type GetMaterialFileParams = {
  materialId: string;
  fileId: string;
};

export const getMaterialFile: AsyncHandler<GetMaterialFileParams, unknown, {}, ParsedQs> = async (req, res) => {
  const { materialId, fileId } = req.params;

  const file = await MaterialRepository.getMaterialFile(materialId, fileId);
  if (!file) {
    throw new ApiError('not found', 404, ['not_found']);
  }

  res.status(200);
  res.setHeader('content-type', file.contentType);
  res.setHeader('content-disposition', `inline; filename="${file.filename}"`);
  res.send(file.body);
};
