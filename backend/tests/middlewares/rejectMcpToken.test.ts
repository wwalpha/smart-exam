import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { rejectMcpToken } from '@/middlewares/rejectMcpToken';

describe('REST token purpose separation', () => {
  it.each(['smart-exam-mcp/read', 'openid smart-exam-mcp/read'])(
    'rejects MCP scope %s before any REST controller',
    (scope) => {
      const token = `fixture.${Buffer.from(JSON.stringify({ scope })).toString('base64url')}.signature`;
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const next = vi.fn();
      rejectMcpToken(
        { headers: { authorization: `Bearer ${token}` } } as Request,
        { status } as unknown as Response,
        next as NextFunction,
      );
      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    },
  );
  it.each([
    undefined,
    'Bearer invalid',
    `Bearer x.${Buffer.from(JSON.stringify({ scope: 'openid profile' })).toString('base64url')}.x`,
  ])('preserves the existing Web/mobile path %s', (authorization) => {
    const next = vi.fn();
    rejectMcpToken({ headers: { authorization } } as Request, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
