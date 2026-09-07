import type { RequestHandler } from 'express';

// 認証無効の既存dev環境でもMCP用tokenをRESTの書込用途へ転用させない。
// ここは拒否専用であり、未検証のpayloadから認証や利用許可を与えない。
export const rejectMcpToken: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (token) {
    try {
      const payload: unknown = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString());
      if (
        payload &&
        typeof payload === 'object' &&
        'scope' in payload &&
        typeof payload.scope === 'string' &&
        payload.scope.split(' ').includes('smart-exam-mcp/read')
      ) {
        res.status(403).json({ error: 'MCP_TOKEN_NOT_ALLOWED' });
        return;
      }
    } catch {
      /* JWT認証の成否は既存Gatewayに委ね、ここでは許可しない。 */
    }
  }
  next();
};
