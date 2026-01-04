import type { NextFunction, Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { ApiError } from '@/lib/apiError';
import { logger } from '@/lib/logger';

export type AsyncHandler<
  Params extends ParamsDictionary = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery extends ParsedQs = ParsedQs,
> = (req: Request<Params, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => Promise<void>;

export function apiHandler<
  Params extends ParamsDictionary = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery extends ParsedQs = ParsedQs,
>(handler: AsyncHandler<Params, ResBody, ReqBody, ReqQuery>) {
  // Express ハンドラーを返却する
  return async (
    req: Request<Params, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
  ): Promise<void> => {
    // 例外処理を開始する
    try {
      // ハンドラーを実行する
      await handler(req, res, next);
      // 例外を捕捉する
    } catch (error) {
      // 例外の種別とメッセージをログへ出す（500の原因追跡のため）
      const errName = (error as any)?.name as string | undefined;
      const errMessage = (error as any)?.message as string | undefined;
      // リクエスト識別子を取得する
      const fallbackRequestId = (res.locals?.requestId as string | undefined) ?? undefined;
      // API エラーへ正規化する
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError(
              (error as Error).message ?? 'internal server error',
              500,
              ['internal_server_error'],
              [],
              fallbackRequestId
            );
      // 失敗ログを出力する
      logger.error(
        `[api] handler error method=${req.method} path=${req.path} requestId=${apiError.requestId} errName=${errName ?? 'unknown'} errMessage=${errMessage ?? 'unknown'}`,
        error
      );
      // エラーレスポンスを送信する
      res.status(apiError.statusCode).json({
        data: {},
        errors: apiError.errorCodes,
        reasons: apiError.reasonCodes,
      } as unknown as ResBody);
    }
  };
}

export const handleRequest = apiHandler;
