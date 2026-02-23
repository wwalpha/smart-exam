import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';
import type { Services } from '@/services/createServices';
import type {
  UploadMaterialFileParams,
  UploadMaterialFileRequest,
  UploadMaterialFileResponse,
} from '@smart-exam/api-types';
import { UploadMaterialFileBodySchema } from './materials.schema';

export const uploadMaterialFile = (
  services: Services,
): AsyncHandler<UploadMaterialFileParams, UploadMaterialFileResponse, UploadMaterialFileRequest, ParsedQs> => {
  return async (req, res) => {
    const { materialId } = req.params;
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UploadMaterialFileBodySchema>;
    const result = await services.materials.uploadMaterialFile(materialId, body);
    res.status(201).json(result);
  };
};
