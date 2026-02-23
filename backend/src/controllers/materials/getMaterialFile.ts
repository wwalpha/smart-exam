import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { Services } from '@/services/createServices';
import { ApiError } from '@/lib/apiError';

type GetMaterialFileParams = {
  materialId: string;
  fileId: string;
};

const toAsciiFallbackFilename = (filename: string): string => {
  const sanitized = filename.replace(/[\r\n"]/g, '_').trim();
  const asciiOnly = sanitized.replace(/[^\x20-\x7E]/g, '_');
  return asciiOnly.length > 0 ? asciiOnly : 'file.pdf';
};

const toContentDisposition = (filename: string): string => {
  const fallback = toAsciiFallbackFilename(filename);
  const encoded = encodeURIComponent(filename)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A');
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`;
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
  // 日本語を含むファイル名でもHTTPヘッダーが壊れないようRFC 5987形式で付与する
  res.setHeader('content-disposition', toContentDisposition(file.filename));
  res.send(file.body);
};
