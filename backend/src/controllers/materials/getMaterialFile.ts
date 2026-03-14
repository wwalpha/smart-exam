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
  { downloadUrl: string },
  Record<string, never>,
  ParsedQs
> => async (req, res) => {
  const { materialId, fileId } = req.params;

  const file = await services.materials.getMaterialFile(materialId, fileId);
  if (!file) {
    throw new ApiError('not found', 404, ['not_found']);
  }

  // 認証付きAPI呼び出しで署名付きURLを取得し、クライアント側で直接S3を開かせる。
  res.json(file);
};
