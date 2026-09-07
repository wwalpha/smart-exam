import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { DateUtils } from '@/lib/dateUtils';
import { LearningRepository } from '@/repositories/learningRead';
import { read } from '@/services/learningRead';
import { freshQuality, ReadError } from '@/services/learningRead/common';
import { businessError, inputs, responseSchema } from './schema';
import type { ReadConfig, ReadContext, ToolName } from '../../typings/learningRead';

export const configFromEnvironment = (): ReadConfig => ({
  environment: process.env.MCP_ENVIRONMENT ?? '',
  serverVersion: process.env.MCP_BUILD_ID ?? '',
  endpoint: process.env.MCP_ENDPOINT ?? '',
  issuer: process.env.MCP_ISSUER ?? '',
  clientId: process.env.MCP_CLIENT_ID ?? '',
  scope: 'smart-exam-mcp/read',
  allowedSubjects: JSON.parse(process.env.MCP_ALLOWED_SUBJECTS ?? '[]'),
  allowedOrigins: JSON.parse(process.env.MCP_ALLOWED_ORIGINS ?? '[]'),
  referenceSecret: process.env.MCP_REFERENCE_SECRET ?? '',
});
const reply = (statusCode: number, body: unknown, headers = {}): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  body: JSON.stringify(body),
});
export const handle = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
  config: ReadConfig,
  repo: LearningRepository,
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (
    !config.endpoint ||
    !config.issuer ||
    !config.clientId ||
    !config.environment ||
    !config.serverVersion ||
    config.referenceSecret.length < 32
  )
    return reply(503, { error: 'SERVER_NOT_CONFIGURED' });
  const method = event.requestContext.http.method;
  const discovery = '/.well-known/oauth-protected-resource/mcp/v1';
  if (method === 'GET' && event.rawPath === discovery)
    return reply(200, {
      resource: config.endpoint,
      authorization_servers: [config.issuer],
      scopes_supported: [config.scope],
      bearer_methods_supported: ['header'],
    });
  if (event.rawPath !== '/mcp/v1') return reply(404, { error: 'NOT_FOUND' });
  if (method !== 'POST') return reply(405, { error: 'METHOD_NOT_ALLOWED' }, { allow: 'POST' });
  const claims = event.requestContext.authorizer?.jwt?.claims;
  // JWT署名はGateway専用authorizerで検証。呼出し元headerの認証contextは一切信用しない。
  if (!event.headers.authorization || !claims)
    return reply(
      401,
      { error: 'UNAUTHORIZED' },
      { 'www-authenticate': `Bearer resource_metadata="${new URL(discovery, config.endpoint)}"` },
    );
  const groups = String(claims['cognito:groups'] ?? '')
    .replace(/[\]"'[]/g, '')
    .split(/[,\s]+/);
  const now = DateUtils.unix();
  if (
    claims.iss !== config.issuer ||
    claims.aud !== config.endpoint ||
    claims.client_id !== config.clientId ||
    claims.token_use !== 'access' ||
    Number(claims.exp) <= now ||
    !Number.isFinite(Number(claims.exp)) ||
    Number(claims.iat) > now ||
    !String(claims.scope ?? '')
      .split(' ')
      .includes(config.scope) ||
    !(config.allowedSubjects.includes(String(claims.sub)) || groups.includes('MCP_READERS'))
  )
    return reply(403, { error: 'FORBIDDEN' });
  if (event.headers.origin && !config.allowedOrigins.includes(event.headers.origin))
    return reply(403, { error: 'ORIGIN_FORBIDDEN' });
  const body = event.body
    ? Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8').toString()
    : '';
  if (Buffer.byteLength(body) > 32_768) return reply(413, { error: 'REQUEST_TOO_LARGE' });
  const server = new McpServer(
    { name: 'smart-exam', version: config.serverVersion },
    { capabilities: { tools: { listChanged: false } } },
  );
  for (const name of Object.keys(inputs) as ToolName[]) {
    server.registerTool(
      name,
      {
        description: `Smart Exam read-only ${name}. LIVE data; follow nextCursor even on empty pages.`,
        inputSchema: inputs[name],
        outputSchema: responseSchema(name),
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (args: unknown) => {
        const start = Date.now();
        const ctx: ReadContext = {
          repo,
          config,
          requestId: event.requestContext.requestId,
          observedAt: DateUtils.now(),
          deadline: start + 20_000,
          quality: freshQuality(),
        };
        try {
          const result = responseSchema(name).parse(await read(ctx, name, args));
          const content = [{ type: 'text' as const, text: JSON.stringify(result) }];
          if (Buffer.byteLength(JSON.stringify({ structuredContent: result, content })) > 256 * 1024)
            throw new ReadError('RESPONSE_TOO_LARGE');
          console.info(
            JSON.stringify({
              requestId: ctx.requestId,
              tool: name,
              elapsedMs: Date.now() - start,
              responseBytes: Buffer.byteLength(content[0].text),
            }),
          );
          return { structuredContent: result, content };
        } catch (error) {
          const code = error instanceof ReadError ? error.code : 'UPSTREAM_UNAVAILABLE';
          console.info(
            JSON.stringify({
              requestId: ctx.requestId,
              tool: name,
              errorCode: code,
              elapsedMs: Date.now() - start,
            }),
          );
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  businessError.parse({
                    code,
                    message: code,
                    retryable: error instanceof ReadError ? error.retryable : true,
                    requestId: ctx.requestId,
                  }),
                ),
              },
            ],
          };
        }
      },
    );
  }
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const headers = new Headers();
    for (const [key, value] of Object.entries(event.headers))
      if (value !== undefined) headers.set(key, value);
    const response = await transport.handleRequest(new Request(config.endpoint, { method, headers, body }));
    return {
      statusCode: response.status,
      headers: { ...Object.fromEntries(response.headers), 'cache-control': 'no-store' },
      body: await response.text(),
    };
  } catch {
    return reply(500, { error: 'INTERNAL_ERROR' });
  } finally {
    await server.close();
  }
};
const repository = new LearningRepository();
export const handler = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) =>
  handle(event, configFromEnvironment(), repository);
