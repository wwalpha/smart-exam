import { describe, expect, it } from 'vitest';
import { DateUtils } from '@/lib/dateUtils';

describe('DateUtils', () => {
  it('now returns ISO string', () => {
    const now = DateUtils.now();
    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
