import { describe, expect, it } from 'vitest';

import { handler } from '@/controllers/health';

describe('health handler', () => {
  it('returns ok', async () => {
    const res = await handler();
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });
});
