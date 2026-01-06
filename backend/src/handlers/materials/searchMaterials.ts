import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type { SearchMaterialsRequest, SearchMaterialsResponse } from '@smart-exam/api-types';
import { z } from 'zod';
import type { ValidatedBody } from '@/types/express';
import { DateUtils } from '@/lib/dateUtils';
import { SubjectIdSchema } from '@/lib/zodSchemas';

export const SearchMaterialsBodySchema = z.object({
  subject: SubjectIdSchema.optional(),
  grade: z.string().optional(),
  provider: z.string().optional(),
  from: z.string().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }).optional(),
  to: z.string().refine((v) => DateUtils.isValidYmd(v), { message: 'Invalid YYYY-MM-DD' }).optional(),
  q: z.string().optional(),
});

export const searchMaterials: AsyncHandler<{}, SearchMaterialsResponse, SearchMaterialsRequest, ParsedQs> = async (
  req,
  res
) => {
  const items = await MaterialRepository.listMaterials();

  const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchMaterialsBodySchema>;

  const subject = (body.subject ?? '').trim();
  const grade = (body.grade ?? '').trim();
  const provider = (body.provider ?? '').trim();
  const from = (body.from ?? '').trim();
  const to = (body.to ?? '').trim();
  const q = (body.q ?? '').trim();

  const subjectLower = subject.toLowerCase();
  const qLower = q.toLowerCase();

  const filtered = items.filter((x) => {
    if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
    if (grade && String(x.grade ?? '') !== grade) return false;
    if (provider && String(x.provider ?? '') !== provider) return false;

    if (from || to) {
      const performed = String(x.materialDate ?? '');
      if (!performed) return false;
      if (from && performed < from) return false;
      if (to && performed > to) return false;
    }
    if (!qLower) return true;

    const haystack = [x.name, x.provider, x.materialDate]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' ')
      .toLowerCase();

    return haystack.includes(qLower);
  });

  res.json({ items: filtered, total: filtered.length });
};
