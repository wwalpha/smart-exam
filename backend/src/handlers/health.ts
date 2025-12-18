import { jsonResponse } from '../types/http.js';

export const handler = async (): Promise<ReturnType<typeof jsonResponse>> => {
  return jsonResponse(200, { ok: true });
};
