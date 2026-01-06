import type { RequestHandler } from 'express';
import { z } from 'zod';

const normalizePath = (path: readonly (string | number | symbol)[]): Array<string | number> => {
  return path.map((p) => {
    if (typeof p === 'symbol') return p.description ?? String(p);
    return p;
  });
};

const toIssues = (error: z.ZodError): Array<{ path: (string | number)[]; message: string; code: string }> => {
  return error.issues.map((i) => {
    const issue = i as unknown as {
      path: readonly (string | number | symbol)[];
      message: string;
      code: unknown;
    };
    return {
      path: normalizePath(issue.path),
      message: issue.message,
      code: String(issue.code),
    };
  });
};

type ValidateOptions = {
  assignToBody?: boolean;
};

const validate = (params: {
  schema: z.ZodType;
  target: 'body' | 'query' | 'params';
  options?: ValidateOptions;
}): RequestHandler => {
  return (req, res, next) => {
    const raw = params.target === 'body' ? req.body : params.target === 'query' ? req.query : req.params;

    const parsed = params.schema.safeParse(raw);
    if (!parsed.success) {
      res.status(400).json({
        message:
          params.target === 'body'
            ? 'Invalid request body'
            : params.target === 'query'
              ? 'Invalid request query'
              : 'Invalid request params',
        issues: toIssues(parsed.error),
      });
      return;
    }

    req.validated = {
      ...req.validated,
      ...(params.target === 'body' ? { body: parsed.data } : {}),
      ...(params.target === 'query' ? { query: parsed.data } : {}),
      ...(params.target === 'params' ? { params: parsed.data } : {}),
    };

    if (params.target === 'body' && params.options?.assignToBody === true) {
      req.body = parsed.data;
    }

    next();
  };
};

export const validateBody = (schema: z.ZodType, options?: ValidateOptions): RequestHandler => {
  return validate({ schema, target: 'body', options });
};

export const validateQuery = (schema: z.ZodType): RequestHandler => {
  return validate({ schema, target: 'query' });
};

export const validateParams = (schema: z.ZodType): RequestHandler => {
  return validate({ schema, target: 'params' });
};
