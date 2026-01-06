import type { infer as zInfer, ZodTypeAny } from 'zod';

export type ValidatedBody<T extends ZodTypeAny> = zInfer<T>;
export type ValidatedQuery<T extends ZodTypeAny> = zInfer<T>;
export type ValidatedParams<T extends ZodTypeAny> = zInfer<T>;

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
