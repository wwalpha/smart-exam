import { describe, expect, it, vi } from 'vitest';
import { getUploadUrl, generatePresignedUrl } from '@/handlers/s3';
import { Request, Response } from 'express';

// Mock generatePresignedUrl since it's exported but also used internally.
// However, since we are testing the handler which calls generatePresignedUrl,
// we should mock the AWS calls inside generatePresignedUrl OR mock generatePresignedUrl if we can.
// Since generatePresignedUrl is in the same file, mocking it via module mock might be tricky if it's a direct call.
// But here we are importing it.
// Let's mock the AWS SDKs instead to test generatePresignedUrl too.

vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-url'),
}));

describe('s3 handler', () => {
  it('getUploadUrl returns url', async () => {
    const req = {
      body: { fileName: 'test.pdf', contentType: 'application/pdf' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await getUploadUrl(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      uploadUrl: 'https://mock-url',
      fileKey: expect.stringContaining('uploads/'),
    });
  });
});
