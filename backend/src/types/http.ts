/**
 * HTTPレスポンス
 */
export type HttpResponse = {
  /** ステータスコード */
  statusCode: number;
  /** ヘッダー */
  headers?: Record<string, string>;
  /** ボディ */
  body: string;
};

/**
 * JSON値
 */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

/**
 * JSONレスポンスを生成する
 * @param statusCode ステータスコード
 * @param payload レスポンスボディ
 * @returns HTTPレスポンス
 */
export const jsonResponse = (statusCode: number, payload: JsonValue): HttpResponse => {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  };
};
