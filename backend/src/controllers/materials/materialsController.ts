// Module: materialsController responsibilities.

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody } from '@/types/express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

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

import { ApiError } from '@/lib/apiError';
import type { Services } from '@/services/createServices';

import {
  CreateMaterialBodySchema,
  SearchMaterialsBodySchema,
  UpdateMaterialBodySchema,
} from './materialsController.schema';

type GetMaterialFileParams = {
  materialId: string;
  fileId: string;
};

/** Creates materials controller. */
export const materialsController = (services: Services) => {
  const listMaterials: AsyncHandler<ParamsDictionary, MaterialListResponse, Record<string, never>, ParsedQs> = async (
    _req,
    res,
  ) => {
    const items = await services.materials.listMaterials();
    res.json({ items, total: items.length });
  };

  const searchMaterials: AsyncHandler<
    ParamsDictionary,
    SearchMaterialsResponse,
    SearchMaterialsRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchMaterialsBodySchema>;
    const result = await services.materials.searchMaterials(body);
    res.json(result);
  };

  const createMaterial: AsyncHandler<
    ParamsDictionary,
    CreateMaterialResponse,
    CreateMaterialRequest,
    ParsedQs
  > = async (req, res) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateMaterialBodySchema>;
    const item = await services.materials.createMaterial(body);
    res.status(201).json(item);
  };

  const getMaterial: AsyncHandler<
    GetMaterialParams,
    GetMaterialResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { materialId } = req.params;
    const item = await services.materials.getMaterial(materialId);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  const updateMaterial: AsyncHandler<
    UpdateMaterialParams,
    UpdateMaterialResponse | { error: string },
    UpdateMaterialRequest,
    ParsedQs
  > = async (req, res) => {
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
    });

    if (!updated) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    if (typeof updates.registeredDate === 'string') {
      await services.questions.recalculateCandidatesForMaterial({
        materialId,
        registeredDate: updates.registeredDate,
      });
    }

    res.json(updated);
  };

  const deleteMaterial: AsyncHandler<
    DeleteMaterialParams,
    DeleteMaterialResponse | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { materialId } = req.params;
    const deleted = await services.materials.deleteMaterial(materialId);
    if (!deleted) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.status(204).send();
  };

  const listMaterialFiles: AsyncHandler<
    ListMaterialFilesParams,
    ListMaterialFilesResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { materialId } = req.params;
    const datas = await services.materials.listMaterialFiles(materialId);
    res.json({ datas });
  };

  const getMaterialFile: AsyncHandler<GetMaterialFileParams, unknown, Record<string, never>, ParsedQs> = async (
    req,
    res,
  ) => {
    const { materialId, fileId } = req.params;

    const file = await services.materials.getMaterialFile(materialId, fileId);
    if (!file) {
      throw new ApiError('not found', 404, ['not_found']);
    }

    res.status(200);
    res.setHeader('content-type', file.contentType);
    res.setHeader('content-disposition', `inline; filename="${file.filename}"`);
    res.send(file.body);
  };

  return {
    CreateMaterialBodySchema,
    SearchMaterialsBodySchema,
    UpdateMaterialBodySchema,
    listMaterials,
    searchMaterials,
    createMaterial,
    getMaterial,
    updateMaterial,
    deleteMaterial,
    listMaterialFiles,
    getMaterialFile,
  };
};
