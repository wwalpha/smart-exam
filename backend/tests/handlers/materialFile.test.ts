import { describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';
import { materialsController } from '@/controllers/materials';
import type { Services } from '@/services';

describe('materialFile handler', () => {
  it('returns pdf buffer', async () => {
    const services = {
      materials: {
        getMaterialFile: vi.fn().mockResolvedValue({
          body: Buffer.from('%PDF-1.4\n%mock'),
          contentType: 'application/pdf',
          filename: 'mock.pdf',
        }),
      },
    } as unknown as Services;

    const controller = materialsController(services);

    const req = {
      params: { materialId: 'm1', fileId: 'abc' },
    } as unknown as Request<{ materialId: string; fileId: string }>;
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      send: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.getMaterialFile(req, res, next);

    expect(services.materials.getMaterialFile).toHaveBeenCalledWith('m1', 'abc');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('content-type', 'application/pdf');
    expect(res.send).toHaveBeenCalled();
  });
});
