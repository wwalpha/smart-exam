import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParsedQs } from 'qs';
import type { UpdateMaterialParams, UpdateMaterialRequest, UpdateMaterialResponse } from '@smart-exam/api-types';
import type { Services } from '@/services/createServices';
import { UpdateMaterialBodySchema } from './materials.schema';

export const updateMaterial =
  (
    services: Services,
  ): AsyncHandler<UpdateMaterialParams, UpdateMaterialResponse | { error: string }, UpdateMaterialRequest, ParsedQs> =>
  async (req, res) => {
    const { materialId } = req.params;
    const updates = ((req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateMaterialBodySchema>) ?? {};

    const updated = await services.materials.updateMaterial(materialId, {
      ...(typeof updates.materialDate === 'string' ? { materialDate: updates.materialDate } : {}),
      ...(typeof updates.name === 'string' ? { title: updates.name } : {}),
      ...(typeof updates.subject === 'string' ? { subjectId: updates.subject } : {}),
      ...(typeof updates.grade === 'string' ? { grade: updates.grade } : {}),
      ...(typeof updates.provider === 'string' ? { provider: updates.provider } : {}),
      ...(typeof updates.registeredDate === 'string' ? { registeredDate: updates.registeredDate } : {}),
      ...(typeof updates.questionPdfPath === 'string' ? { questionPdfPath: updates.questionPdfPath } : {}),
      ...(typeof updates.answerPdfPath === 'string' ? { answerPdfPath: updates.answerPdfPath } : {}),
      ...(typeof updates.answerSheetPath === 'string' ? { answerSheetPath: updates.answerSheetPath } : {}),
      ...(typeof updates.isCompleted === 'boolean' ? { isCompleted: updates.isCompleted } : {}),
    });

    if (!updated) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    if (typeof updates.registeredDate === 'string') {
      await services.materialQuestions.recalculateCandidatesForMaterial({
        materialId,
        registeredDate: updates.registeredDate,
      });
    }

    if (updates.isCompleted === true) {
      await services.materialQuestions.applyQuestionChoicesToCandidatesForMaterial({ materialId });
    }

    res.json(updated);
  };
