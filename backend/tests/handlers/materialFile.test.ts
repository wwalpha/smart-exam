import { describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';
import { materialsController } from '@/controllers/materials';
import type { Services } from '@/services';

describe('materialFile handler', () => {
  it('returns the existing authenticated download URL contract', async () => {
    const services = {
      materials: {
        getMaterialFile: vi.fn().mockResolvedValue({
          downloadUrl: 'https://fixture.invalid/stored.pdf',
        }),
      },
    } as unknown as Services;

    const controller = materialsController(services);

    const req = {
      params: { materialId: 'm1', fileId: 'abc' },
    } as unknown as Request<{ materialId: string; fileId: string }>;
    const res = {
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.getMaterialFile(req, res, next);

    expect(services.materials.getMaterialFile).toHaveBeenCalledWith('m1', 'abc');
    expect(res.json).toHaveBeenCalledWith({ downloadUrl: 'https://fixture.invalid/stored.pdf' });
  });
});
