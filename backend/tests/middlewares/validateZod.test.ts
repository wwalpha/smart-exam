import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '@/middlewares/validateZod';

describe('validateBody', () => {
  it('returns 400 with issues when required field is missing', () => {
    const schema = z.object({ item: z.string() });
    const mw = validateBody(schema);

    const req = { body: {} } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid request body',
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: ['item'],
            code: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.validated.body and calls next on success', () => {
    const schema = z.object({ item: z.string() });
    const mw = validateBody(schema);

    const req = { body: { item: 'ok' } } as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    mw(req, res, next);

    expect(req.validated?.body).toEqual({ item: 'ok' });
    expect(next).toHaveBeenCalled();
  });

  it('assignToBody replaces req.body only when enabled', () => {
    const schema = z.object({ count: z.coerce.number() });

    const mwNoAssign = validateBody(schema);
    const req1 = { body: { count: '10' } } as unknown as Request;
    const res1 = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next1 = vi.fn() as unknown as NextFunction;
    mwNoAssign(req1, res1, next1);
    expect(req1.body).toEqual({ count: '10' });
    expect(req1.validated?.body).toEqual({ count: 10 });

    const mwAssign = validateBody(schema, { assignToBody: true });
    const req2 = { body: { count: '10' } } as unknown as Request;
    const res2 = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
    const next2 = vi.fn() as unknown as NextFunction;
    mwAssign(req2, res2, next2);
    expect(req2.body).toEqual({ count: 10 });
    expect(req2.validated?.body).toEqual({ count: 10 });
  });
});
