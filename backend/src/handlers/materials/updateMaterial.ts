import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { UpdateMaterialParams, UpdateMaterialRequest, UpdateMaterialResponse } from '@smart-exam/api-types';

export const updateMaterial: AsyncHandler<
  UpdateMaterialParams,
  UpdateMaterialResponse | { error: string },
  UpdateMaterialRequest,
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const updates = req.body ?? {};
  const updated = await MaterialRepository.updateMaterial(materialId, {
    ...(typeof updates.materialDate === 'string' ? { materialDate: updates.materialDate } : {}),
    ...(typeof updates.name === 'string' ? { title: updates.name } : {}),
    ...(typeof updates.subject === 'string' ? { subjectId: updates.subject } : {}),
    ...(typeof updates.grade === 'string' ? { grade: updates.grade } : {}),
    ...(typeof updates.provider === 'string' ? { provider: updates.provider } : {}),
    ...(typeof updates.questionPdfPath === 'string' ? { questionPdfPath: updates.questionPdfPath } : {}),
    ...(typeof updates.answerPdfPath === 'string' ? { answerPdfPath: updates.answerPdfPath } : {}),
    ...(typeof updates.answerSheetPath === 'string' ? { answerSheetPath: updates.answerSheetPath } : {}),
  });
  if (!updated) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(updated);
};
