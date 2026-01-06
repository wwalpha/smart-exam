import { MaterialRepository } from '@/repositories';
import type { AsyncHandler } from '@/lib/handler';
import type { ParsedQs } from 'qs';
import { ApiError } from '@/lib/apiError';
import type {
  CreateMaterialRequest,
  CreateMaterialResponse,
  DeleteMaterialParams,
  DeleteMaterialResponse,
  GetMaterialParams,
  GetMaterialResponse,
  ListMaterialFilesParams,
  ListMaterialFilesResponse,
  MaterialListResponse,
  SearchMaterialsRequest,
  SearchMaterialsResponse,
  UpdateMaterialParams,
  UpdateMaterialRequest,
  UpdateMaterialResponse,
} from '@smart-exam/api-types';

type GetMaterialFileParams = {
  materialId: string;
  fileId: string;
};

export const listMaterials: AsyncHandler<{}, MaterialListResponse, {}, ParsedQs> = async (req, res) => {
  const items = await MaterialRepository.listMaterials();
  res.json({ items, total: items.length });
};

export const searchMaterials: AsyncHandler<
  {},
  SearchMaterialsResponse,
  SearchMaterialsRequest,
  ParsedQs
> = async (req, res) => {
  const items = await MaterialRepository.listMaterials();

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
      const performed = String(x.executionDate ?? '');
      if (!performed) return false;
      if (from && performed < from) return false;
      if (to && performed > to) return false;
    }
    if (!qLower) return true;

    const haystack = [x.name, x.provider, x.executionDate]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .join(' ')
      .toLowerCase();

    return haystack.includes(qLower);
  });

  res.json({ items: filtered, total: filtered.length });
};

export const updateMaterial: AsyncHandler<
  UpdateMaterialParams,
  UpdateMaterialResponse | { error: string },
  UpdateMaterialRequest,
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const updates = req.body ?? {};
  const updated = await MaterialRepository.updateMaterial(materialId, {
    ...(typeof updates.executionDate === 'string' ? { executionDate: updates.executionDate } : {}),
    ...(typeof updates.name === 'string' ? { title: updates.name } : {}),
    ...(typeof updates.subject === 'string' ? { subjectId: updates.subject as any } : {}),
    ...(typeof updates.grade === 'string' ? { grade: updates.grade } : {}),
    ...(typeof updates.provider === 'string' ? { provider: updates.provider } : {}),
    ...(typeof (updates as any).questionPdfPath === 'string' ? { questionPdfPath: (updates as any).questionPdfPath } : {}),
    ...(typeof (updates as any).answerPdfPath === 'string' ? { answerPdfPath: (updates as any).answerPdfPath } : {}),
    ...(typeof (updates as any).answerSheetPath === 'string' ? { answerSheetPath: (updates as any).answerSheetPath } : {}),
  });
  if (!updated) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(updated);
};

export const createMaterial: AsyncHandler<
  {},
  CreateMaterialResponse,
  CreateMaterialRequest,
  ParsedQs
> = async (req, res) => {
  const item = await MaterialRepository.createMaterial(req.body);
  res.status(201).json(item);
};

export const getMaterial: AsyncHandler<
  GetMaterialParams,
  GetMaterialResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const item = await MaterialRepository.getMaterial(materialId);
  if (!item) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }
  res.json(item);
};

export const deleteMaterial: AsyncHandler<
  DeleteMaterialParams,
  DeleteMaterialResponse | { error: string },
  {},
  ParsedQs
> = async (req, res) => {
  const { materialId } = req.params;
  const deleted = await MaterialRepository.deleteMaterial(materialId);
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

export const getMaterialFile: AsyncHandler<GetMaterialFileParams, unknown, {}, ParsedQs> = async (req, res) => {
  const { materialId, fileId } = req.params;
  if (!materialId || !fileId) {
    throw new ApiError('materialId and fileId are required', 400, ['invalid_request']);
  }

  const file = await MaterialRepository.getMaterialFile(materialId, fileId);
  if (!file) {
    throw new ApiError('not found', 404, ['not_found']);
  }

  res.status(200);
  res.setHeader('content-type', file.contentType);
  res.setHeader('content-disposition', `inline; filename="${file.filename}"`);
  res.send(file.body);
};
