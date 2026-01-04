import { describe, expect, it, vi } from 'vitest';
import { listMaterialSets, createMaterialSet, getMaterialSet } from '@/handlers/material';
import { MaterialRepository } from '@/repositories';
import { Request, Response } from 'express';
import type { CreateMaterialSetRequest, GetMaterialSetParams } from '@smart-exam/api-types';

// repository methods are spied per-test

describe('material handler', () => {
  it('listMaterialSets returns items', async () => {
    const mockItems = [{ id: '1', name: 'Test Material' }];
    vi.spyOn(MaterialRepository, 'listMaterialSets').mockResolvedValue(mockItems as any);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await listMaterialSets(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createMaterialSet creates item', async () => {
    const mockItem = { id: '1', name: 'Test Material' };
    vi.spyOn(MaterialRepository, 'createMaterialSet').mockResolvedValue(mockItem as any);

    const req = {
      body: { name: 'Test Material' },
    } as Request<Record<string, never>, unknown, CreateMaterialSetRequest>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createMaterialSet(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });

  it('getMaterialSet returns item', async () => {
    const mockItem = { id: '1', name: 'Test Material' };
    vi.spyOn(MaterialRepository, 'getMaterialSet').mockResolvedValue(mockItem as any);

    const req = {
      params: { materialSetId: '1' },
    } as unknown as Request<GetMaterialSetParams>;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await getMaterialSet(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
