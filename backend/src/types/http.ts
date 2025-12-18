export type HttpResponse = {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
};

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export const jsonResponse = (statusCode: number, payload: JsonValue): HttpResponse => {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(payload)
  };
};
