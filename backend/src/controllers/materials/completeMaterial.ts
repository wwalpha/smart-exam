import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { CompleteMaterialParams, CompleteMaterialResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';

export const completeMaterial = (
  services: Services,
): AsyncHandler<
  CompleteMaterialParams,
  CompleteMaterialResponse | { error: string },
  Record<string, never>,
  ParsedQs
> => {
  return async (req, res) => {
    const { materialId } = req.params;
    const updated = await services.materials.updateMaterial(materialId, { isCompleted: true });
    if (!updated) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    await services.materialQuestions.applyChoices({
      materialId,
      baseDateYmd: updated.registeredDate,
    });

    res.json(updated);
  };
};
