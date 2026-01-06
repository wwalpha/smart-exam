import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { UpdateMaterialParams, UpdateMaterialRequest, UpdateMaterialResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';
import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';

export const UpdateMaterialBodySchema = z.object({
  name: z.string().min(1).optional(),
  subject: SubjectIdSchema.optional(),
  materialDate: z.string().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }).optional(),
  grade: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  questionPdfPath: z.string().min(1).optional(),
  answerPdfPath: z.string().min(1).optional(),
  answerSheetPath: z.string().min(1).optional(),
});

export const updateMaterial: AsyncHandler<
  UpdateMaterialParams,
  UpdateMaterialResponse | { error: string },
  UpdateMaterialRequest,
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const updates = ((req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateMaterialBodySchema>) ?? {};
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
