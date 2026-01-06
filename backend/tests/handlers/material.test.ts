import { describe, expect, it, vi } from 'vitest';
import { listMaterials, createMaterial, getMaterial } from '@/handlers/material';
import { MaterialRepository } from '@/repositories';
import { Request, Response } from 'express';
import type { CreateMaterialRequest, GetMaterialParams } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('material handler', () => {
  it('listMaterials returns items', async () => {
    const mockItems = [{ id: '1', name: 'Test Material' }];
    vi.spyOn(MaterialRepository, 'listMaterials').mockResolvedValue(mockItems as any);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await listMaterials(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createMaterial creates item', async () => {
    const mockItem = { id: '1', name: 'Test Material' };
    vi.spyOn(MaterialRepository, 'createMaterial').mockResolvedValue(mockItem as any);

    const req = {
      body: { name: 'Test Material' },
    } as Request<Record<string, never>, unknown, CreateMaterialRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createMaterial(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('getMaterial returns item', async () => {
    const mockItem = { id: '1', name: 'Test Material' };
    vi.spyOn(MaterialRepository, 'getMaterial').mockResolvedValue(mockItem as any);

    const req = {
      params: { materialId: '1' },
    } as unknown as Request<GetMaterialParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await getMaterial(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
