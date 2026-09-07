import { afterAll, beforeAll, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createApp } from '@/app/createApp';
import { close, listen } from './fixture';
let server: Server;
let url: string;
beforeAll(async () => {
  server = createServer(createApp());
  url = await listen(server);
});
afterAll(async () => {
  await close(server);
});
it('blocks MCP token on the real REST app before a write handler, while health stays usable', async () => {
  const token = `fixture.${Buffer.from(JSON.stringify({ scope: 'smart-exam-mcp/read' })).toString('base64url')}.signature`;
  const response = await fetch(`${url}/api/materials`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: '{}',
  });
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: 'MCP_TOKEN_NOT_ALLOWED' });
  expect((await fetch(`${url}/v1/health`)).status).toBe(200);
});
