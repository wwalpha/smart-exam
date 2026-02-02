import { describe, expect, it, vi } from 'vitest';
import { createS3Controller } from '@/controllers/s3/createS3Controller';
import type { Services } from '@/services';
import { Request, Response } from 'express';

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-url'),
}));

describe('s3 handler', () => {
  it('getUploadUrl returns url', async () => {
    const services = {
      s3: {
        getUploadUrl: vi.fn().mockResolvedValue({
          uploadUrl: 'https://mock-url',
          fileKey: 'uploads/mock.pdf',
        }),
      },
    } as unknown as Services;

    const controller = createS3Controller(services);

    const req = {
      body: { fileName: 'test.pdf', contentType: 'application/pdf' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.getUploadUrl(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      uploadUrl: 'https://mock-url',
      fileKey: expect.stringContaining('uploads/'),
    });
  });
});
