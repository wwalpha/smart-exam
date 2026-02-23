import { describe, expect, it, vi } from 'vitest';
import { materialsController } from '@/controllers/materials';
import type { Services } from '@/services';
import { Request, Response } from 'express';
import type { CreateMaterialRequest, GetMaterialParams, UploadMaterialFileRequest } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('material handler', () => {
  it('listMaterials returns items', async () => {
    const mockItems = [{ id: '1', name: 'Test Material' }];

    const services = {
      materials: {
        listMaterials: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = materialsController(services);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.listMaterials(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createMaterial creates item', async () => {
    const mockResponse = { items: [{ id: '1', name: 'Test Material' }] };

    const services = {
      materials: {
        createMaterial: vi.fn().mockResolvedValue(mockResponse as unknown),
      },
    } as unknown as Services;

    const controller = materialsController(services);

    const req = {
      body: {
        name: 'Test Material',
        subject: ['4'],
        grade: '4年',
        provider: 'SAPIX',
        materialDate: '2025-01-01',
        registeredDate: '2025-01-01',
      },
    } as Request<Record<string, never>, unknown, CreateMaterialRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.createMaterial(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });

  it('getMaterial returns item', async () => {
    const mockItem = { id: '1', name: 'Test Material' };

    const services = {
      materials: {
        getMaterial: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = materialsController(services);

    const req = {
      params: { materialId: '1' },
    } as unknown as Request<GetMaterialParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.getMaterial(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('uploadMaterialFile returns presigned url', async () => {
    const mockResponse = {
      uploadUrl: 'https://example.com/presigned',
      fileKey: 'materials/m1/QUESTION/f1',
    };

    const services = {
      materials: {
        uploadMaterialFile: vi.fn().mockResolvedValue(mockResponse),
      },
    } as unknown as Services;

    const controller = materialsController(services);

    const req = {
      params: { materialId: 'm1' },
      body: {
        contentType: 'application/pdf',
        fileName: 'sample.pdf',
        filetype: 'QUESTION',
      },
    } as unknown as Request<{ materialId: string }, unknown, UploadMaterialFileRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.uploadMaterialFile(req, res, next);

    expect(services.materials.uploadMaterialFile).toHaveBeenCalledWith('m1', {
      contentType: 'application/pdf',
      fileName: 'sample.pdf',
      filetype: 'QUESTION',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResponse);
  });
});
