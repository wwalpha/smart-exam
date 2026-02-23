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

  // Lambda/API Gateway のレスポンス上限を回避するため、実体は S3 から直接取得させる
  res.redirect(302, file.downloadUrl);
};
