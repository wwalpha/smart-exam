import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { Input, Position, Quality, ReadContext, Row, ToolName } from '../../../typings/learningRead';

export class ReadError extends Error {
  constructor(
    readonly code: string,
    readonly retryable = false,
  ) {
    super(code);
  }
}
export const freshQuality = (): Quality => ({
  consistency: 'LIVE',
  pointInTimeSnapshot: false,
  warnings: [],
  missingSources: [],
});
// キー順だけを正規化し、配列順・文字列・nullと欠損の原値を保持する。
export const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const pairs: string[] = [];
    for (const key of Object.keys(value).sort()) {
      if ((value as Row)[key] !== undefined)
        pairs.push(`${JSON.stringify(key)}:${canonical((value as Row)[key])}`);
    }
    return `{${pairs.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
};
export const hash = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
export const seal = (ctx: ReadContext, purpose: string, value: unknown): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    'aes-256-gcm',
    createHash('sha256').update(ctx.config.referenceSecret).digest(),
    iv,
  );
  cipher.setAAD(Buffer.from(`${ctx.config.environment}:${purpose}`));
  const bytes = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64url');
};
export const unseal = (ctx: ReadContext, purpose: string, token: string): unknown => {
  try {
    const bytes = Buffer.from(token, 'base64url');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      createHash('sha256').update(ctx.config.referenceSecret).digest(),
      bytes.subarray(0, 12),
    );
    decipher.setAAD(Buffer.from(`${ctx.config.environment}:${purpose}`));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
  } catch {
    throw new ReadError(purpose === 'file' ? 'NOT_FOUND' : 'INVALID_CURSOR');
  }
};
export const binding = (tool: ToolName, input: Input) => {
  const {
    cursor: _cursor,
    pageSize: _size,
    ...filter
  } = input as Input & { cursor?: string; pageSize?: number };
  void _cursor;
  void _size;
  return hash({ tool, filter });
};
const positionSchema = z.strictObject({
  key: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  phase: z.string().optional(),
  offset: z.number().int().nonnegative().optional(),
  after: z.string().optional(),
  s3Token: z.string().optional(),
});
export const position = (ctx: ReadContext, tool: ToolName, input: Input): Position => {
  if (!('cursor' in input) || !input.cursor) return {};
  const parsed = positionSchema.safeParse(unseal(ctx, binding(tool, input), input.cursor));
  if (!parsed.success) throw new ReadError('INVALID_CURSOR');
  return parsed.data;
};
export const signal = (ctx: ReadContext) => AbortSignal.timeout(Math.max(1, ctx.deadline - Date.now()));
export const checkTime = (ctx: ReadContext) => {
  if (Date.now() >= ctx.deadline) throw new ReadError('UPSTREAM_UNAVAILABLE', true);
};
export const table = (name: string) => {
  const value = process.env[`TABLE_${name}`];
  if (!value) throw new ReadError('UPSTREAM_UNAVAILABLE');
  return value;
};
export const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);
export const num = (value: unknown): number | null => (typeof value === 'number' ? value : null);
export const bool = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);
export const ref = (entityType: string, entityId: string, field?: string) => ({
  entityType,
  entityId,
  ...(field ? { field } : {}),
});
export const get = async (ctx: ReadContext, name: string, key: Record<string, string | number>) => {
  checkTime(ctx);
  return await ctx.repo.get(table(name), key, signal(ctx));
};
export const warn = (ctx: ReadContext, warning: string) => {
  if (!ctx.quality.warnings.includes(warning)) ctx.quality.warnings.push(warning);
};
export const collection = (items: unknown[], availability?: string) => ({
  items,
  order: 'UNSPECIFIED',
  total: null,
  ...(availability ? { availability } : {}),
});
