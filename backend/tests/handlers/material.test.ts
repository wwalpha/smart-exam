import { describe, expect, it, vi } from 'vitest';
import { createMaterialsController } from '@/controllers/materials/createMaterialsController';
import type { Services } from '@/services';
import { Request, Response } from 'express';
import type { CreateMaterialRequest, GetMaterialParams } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('material handler', () => {
  it('listMaterials returns items', async () => {
    const mockItems = [{ id: '1', name: 'Test Material' }];

    const services = {
      materials: {
        listMaterials: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = createMaterialsController(services);

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
    const mockItem = { id: '1', name: 'Test Material' };

    const services = {
      materials: {
        createMaterial: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = createMaterialsController(services);

    const req = {
      body: {
        name: 'Test Material',
        subject: '4',
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
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('getMaterial returns item', async () => {
    const mockItem = { id: '1', name: 'Test Material' };

    const services = {
      materials: {
        getMaterial: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = createMaterialsController(services);

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
});
