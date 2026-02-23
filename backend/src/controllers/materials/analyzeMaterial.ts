import type { AnalyzeMaterialParams, AnalyzeMaterialResponse } from '@smart-exam/api-types';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { Services } from '@/services/createServices';

export const analyzeMaterial = (
  services: Services,
): AsyncHandler<AnalyzeMaterialParams, AnalyzeMaterialResponse, Record<string, never>, ParsedQs> => {
  return async (req, res) => {
    const { materialId } = req.params;
    const result = await services.materials.analyzeMaterial(materialId);
    res.status(200).json(result);
  };
};
