import type { z } from 'zod';

export type ValidatedBody<T extends z.ZodType> = z.infer<T>;
export type ValidatedQuery<T extends z.ZodType> = z.infer<T>;
export type ValidatedParams<T extends z.ZodType> = z.infer<T>;

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
