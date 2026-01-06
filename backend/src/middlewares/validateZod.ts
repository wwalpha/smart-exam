import type { RequestHandler } from 'express';
import type { ZodTypeAny, ZodError, ZodIssue } from 'zod';

const normalizePath = (path: readonly (string | number | symbol)[]): Array<string | number> => {
  return path.map((p) => {
    if (typeof p === 'symbol') return p.description ?? String(p);
    return p;
  });
};

const toIssues = (error: ZodError): Array<{ path: (string | number)[]; message: string; code: string }> => {
  return error.issues.map((i: ZodIssue) => ({
    path: normalizePath(i.path as readonly (string | number | symbol)[]),
    message: i.message,
    code: String(i.code),
  }));
};

type ValidateOptions = {
  assignToBody?: boolean;
};

const validate = (params: {
  schema: ZodTypeAny;
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

export const validateBody = <T extends ZodTypeAny>(schema: T, options?: ValidateOptions): RequestHandler => {
  return validate({ schema, target: 'body', options });
};

export const validateQuery = <T extends ZodTypeAny>(schema: T): RequestHandler => {
  return validate({ schema, target: 'query' });
};

export const validateParams = <T extends ZodTypeAny>(schema: T): RequestHandler => {
  return validate({ schema, target: 'params' });
};
