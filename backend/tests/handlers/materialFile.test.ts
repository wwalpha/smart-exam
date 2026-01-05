import { describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';
import { getMaterialFile } from '@/handlers/materialFile';
import { MaterialRepository } from '@/repositories';

describe('materialFile handler', () => {
  it('returns pdf buffer', async () => {
    vi.spyOn(MaterialRepository, 'getMaterialFileByKey').mockResolvedValue({
      body: Buffer.from('%PDF-1.4\n%mock'),
      contentType: 'application/pdf',
      filename: 'mock.pdf',
    });

    const req = {
      query: { key: 'materials/m1/QUESTION/abc-mock.pdf' },
    } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      send: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    await getMaterialFile(req, res, next);

    expect(MaterialRepository.getMaterialFileByKey).toHaveBeenCalledWith('materials/m1/QUESTION/abc-mock.pdf');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('content-type', 'application/pdf');
    expect(res.send).toHaveBeenCalled();
  });
});
