import { describe, expect, it, vi } from 'vitest';
import { listMaterialSets, createMaterialSet, getMaterialSet } from '@/handlers/material';
import { MaterialRepository } from '@/repositories/materialRepository';
import { Request, Response } from 'express';

vi.mock('@/repositories/materialRepository');

describe('material handler', () => {
  it('listMaterialSets returns items', async () => {
    const mockItems = [{ id: '1', name: 'Test Material' }];
    vi.mocked(MaterialRepository.listMaterialSets).mockResolvedValue(mockItems as any);

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
    vi.mocked(MaterialRepository.createMaterialSet).mockResolvedValue(mockItem as any);

    const req = {
      body: { name: 'Test Material' },
    } as Request;
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
    vi.mocked(MaterialRepository.getMaterialSet).mockResolvedValue(mockItem as any);

    const req = {
      params: { materialSetId: '1' },
    } as unknown as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await getMaterialSet(req, res, next);

    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
