import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import type {
  CreateMaterialSetRequest,
  CreateMaterialSetResponse,
  DeleteMaterialSetParams,
  DeleteMaterialSetResponse,
  GetMaterialSetParams,
  GetMaterialSetResponse,
  ListMaterialFilesParams,
  ListMaterialFilesResponse,
  MaterialSetListResponse,
  SearchMaterialSetsRequest,
  SearchMaterialSetsResponse,
} from '@smart-exam/api-types';

export const listMaterialSets: AsyncHandler<{}, MaterialSetListResponse, {}, ParsedQs> = async (req, res) => {
  const items = await MaterialRepository.listMaterialSets();
  res.json({ items, total: items.length });
};

export const searchMaterialSets: AsyncHandler<
  {},
  SearchMaterialSetsResponse,
  SearchMaterialSetsRequest,
  ParsedQs
> = async (req, res) => {
  const items = await MaterialRepository.listMaterialSets();

  const subject = (req.body.subject ?? '').trim();
  const grade = (req.body.grade ?? '').trim();
  const provider = (req.body.provider ?? '').trim();
  const from = (req.body.from ?? '').trim();
  const to = (req.body.to ?? '').trim();
  const q = (req.body.q ?? '').trim();

  const subjectLower = subject.toLowerCase();
  const qLower = q.toLowerCase();

  const filtered = items.filter((x) => {
    if (subjectLower && String(x.subject ?? '').toLowerCase() !== subjectLower) return false;
    if (grade && String(x.grade ?? '') !== grade) return false;
    if (provider && String(x.provider ?? '') !== provider) return false;

    if (from || to) {
      const performed = String(x.date ?? x.yearMonth ?? '');
      if (!performed) return false;
      if (from && performed < from) return false;
      if (to && performed > to) return false;
    }
    if (!qLower) return true;

    const haystack = [x.name, x.provider, x.course, x.description, x.yearMonth]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' ')
      .toLowerCase();

    const keywordText = Array.isArray(x.keywords) ? x.keywords.join(' ').toLowerCase() : '';

    return haystack.includes(qLower) || keywordText.includes(qLower);
  });

  res.json({ items: filtered, total: filtered.length });
};

export const createMaterialSet: AsyncHandler<
  {},
  CreateMaterialSetResponse,
  CreateMaterialSetRequest,
  ParsedQs
> = async (req, res) => {
  const item = await MaterialRepository.createMaterialSet(req.body);
  res.status(201).json(item);
};

export const getMaterialSet: AsyncHandler<
  GetMaterialSetParams,
  GetMaterialSetResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const item = await MaterialRepository.getMaterialSet(materialId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const deleteMaterialSet: AsyncHandler<
  DeleteMaterialSetParams,
  DeleteMaterialSetResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const deleted = await MaterialRepository.deleteMaterialSet(materialId);
  if (!deleted) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.status(204).send();
};

export const listMaterialFiles: AsyncHandler<ListMaterialFilesParams, ListMaterialFilesResponse, {}, ParsedQs> = async (
  req,
  res
) => {
  const { materialId } = req.params;
  const items = await MaterialRepository.listMaterialFiles(materialId);
  res.json({ datas: items });
};
