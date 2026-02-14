// Module: health responsibilities.

import { jsonResponse } from '@/types/http';


/** Entry handler. */
export const handler = async (): Promise<ReturnType<typeof jsonResponse>> => {
  return jsonResponse(200, { ok: true });
};
