import { createServer, type Server, type IncomingMessage } from 'node:http';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { LearningRepository } from '@/repositories/learningRead';
import { handle } from '@/mcp/handler';
import type { ReadConfig, Row } from '../../typings/learningRead';

export const fixtureConfig: ReadConfig = {
  environment: 'fixture',
  endpoint: 'https://fixture.invalid/mcp/v1',
  issuer: 'https://issuer.invalid/pool',
  clientId: 'mcp-fixture',
  serverVersion: 'a'.repeat(40),
  scope: 'smart-exam-mcp/read',
  allowedSubjects: ['fixture-user'],
  allowedOrigins: ['https://allowed.invalid'],
  referenceSecret: 'fixture-only-secret'.repeat(3),
};
export const claims = () => ({
  iss: fixtureConfig.issuer,
  aud: fixtureConfig.endpoint,
  client_id: fixtureConfig.clientId,
  token_use: 'access',
  sub: 'fixture-user',
  exp: Math.floor(Date.now() / 1000) + 600,
  iat: Math.floor(Date.now() / 1000),
  scope: fixtureConfig.scope,
});
export const event = (body: unknown, overrides: Row = {}): APIGatewayProxyEventV2WithJWTAuthorizer =>
  ({
    version: '2.0',
    rawPath: '/mcp/v1',
    routeKey: 'POST /mcp/v1',
    rawQueryString: '',
    headers: {
      authorization: 'Bearer fixture-only',
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      'mcp-protocol-version': '2025-11-25',
    },
    requestContext: {
      requestId: 'fixture-request',
      accountId: 'fixture',
      apiId: 'fixture',
      domainName: 'fixture.invalid',
      domainPrefix: 'fixture',
      stage: '$default',
      time: 'fixture',
      timeEpoch: 0,
      routeKey: 'POST /mcp/v1',
      http: {
        method: 'POST',
        path: '/mcp/v1',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'fixture',
      },
      authorizer: {
        principalId: 'fixture',
        integrationLatency: 0,
        jwt: { claims: claims(), scopes: [fixtureConfig.scope] },
      },
    },
    body: JSON.stringify(body),
    isBase64Encoded: false,
    ...overrides,
  }) as APIGatewayProxyEventV2WithJWTAuthorizer;
export const bodyOf = async (req: IncomingMessage) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
};
export const listen = async (server: Server) => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No port');
  return `http://127.0.0.1:${address.port}`;
};
export const close = async (server: Server) => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
};
const keys: Record<string, string[]> = {
  MATERIALS: ['materialId'],
  MATERIAL_QUESTIONS: ['questionId'],
  KANJI: ['wordId'],
  EXAMS: ['examId'],
  EXAM_DETAILS: ['examId', 'seq'],
  EXAM_CANDIDATES: ['subject', 'candidateKey'],
  EXAM_HISTORIES: ['id'],
};
const indexKeys: Record<string, string[]> = {
  gsi_material_id_number: ['materialId', 'number'],
  gsi_target_id_exam_id: ['targetId', 'examId'],
  gsi_question_id_created_at: ['questionId', 'createdAt'],
  gsi_question_id_closed_at: ['questionId', 'closedAt'],
};
export const pdf = readFileSync(new URL('./stored.pdf', import.meta.url));
export const startFixture = async () => {
  const rows: Record<string, Row[]> = Object.fromEntries(Object.keys(keys).map((name) => [name, []]));
  for (const name of Object.keys(keys)) process.env[`TABLE_${name}`] = name;
  rows.MATERIALS = [
    {
      materialId: 'm1',
      title: 'fixture-title',
      subjectId: '4',
      grade: '5',
      provider: 'fixture',
      questionCount: 3,
      materialDate: '2026-01-01',
      registeredDate: '2026-01-02',
      isCompleted: true,
      questionPdfPath: 'materials/m1/QUESTION/pdf1',
      questionPdfFilename: 'question.pdf',
    },
  ];
  rows.MATERIAL_QUESTIONS = [0, 1, 2].map((number) => ({
    questionId: `q${number}`,
    materialId: 'm1',
    subjectId: '4',
    number,
    canonicalKey: `(${number})`,
    ...(number < 2 ? { choice: number === 0 ? 'CORRECT' : 'INCORRECT' } : {}),
    correctAnswer: 'fixture-answer',
  }));
  rows.KANJI = [
    {
      wordId: 'w1',
      subject: '1',
      question: 'やまを見る',
      answer: '山',
      readingHiragana: 'やま',
      underlineSpec: { type: 'promptSpan', start: 0, length: 2 },
    },
  ];
  rows.EXAMS = [
    {
      examId: 'e1',
      mode: 'MATERIAL',
      subject: '4',
      status: 'COMPLETED',
      createdDate: '2026-01-03',
      submittedDate: '2026-01-04',
      count: 1,
      results: [{ id: 'q0', isCorrect: true }],
    },
    {
      examId: 'e2',
      mode: 'MATERIAL',
      subject: '4',
      status: 'IN_PROGRESS',
      createdDate: '2026-02-01',
      count: 1,
      results: [{ id: 'q0', isCorrect: false }],
    },
    ...['k1', 'k2'].map((examId) => ({
      examId,
      mode: 'KANJI',
      subject: '1',
      status: 'COMPLETED',
      createdDate: '2026-01-05',
      submittedDate: '2026-01-06',
      count: 1,
      pdfS3Key: `exams/${examId}.pdf`,
      results: [{ id: 'w1', isCorrect: examId === 'k2' }],
    })),
  ];
  rows.EXAM_DETAILS = rows.EXAMS.map((exam) => ({
    examId: exam.examId,
    seq: 1,
    targetId: exam.mode === 'MATERIAL' ? 'q0' : 'w1',
    targetType: exam.mode,
    isCorrect: exam.examId === 'e1' || exam.examId === 'k2',
  }));
  rows.EXAM_CANDIDATES = [
    {
      subject: '4',
      candidateKey: '2026-03-01#c1',
      id: 'c1',
      questionId: 'q0',
      mode: 'MATERIAL',
      status: 'LOCKED',
      examId: 'e2',
      correctCount: 1,
      nextTime: '2026-03-01',
      createdAt: '2026-02-01',
    },
  ];
  rows.EXAM_HISTORIES = [
    {
      id: 'h1',
      questionId: 'q0',
      mode: 'MATERIAL',
      status: 'CLOSED',
      subject: '4',
      correctCount: 0,
      nextTime: '2026-01-03',
      closedAt: '2026-01-04T10:00:00+09:00',
    },
  ];
  const objects = new Map(
    ['materials/m1/QUESTION/pdf1', 'materials/m1/QUESTION/old.pdf', 'exams/k1.pdf'].map((key) => [
      key,
      { bytes: pdf, etag: '"fixture-etag"', type: 'application/pdf' },
    ]),
  );
  const calls: string[] = [];
  const controls = { fail: false, byteLimit: 1_048_576 };
  const aws = createServer(async (req, res) => {
    try {
      if (controls.fail) {
        res.writeHead(503);
        res.end('{}');
        return;
      }
      const action = String(req.headers['x-amz-target'] ?? '')
        .split('.')
        .at(-1)!;
      if (action) {
        calls.push(action);
        const input = JSON.parse(await bodyOf(req));
        if (!['GetItem', 'Query', 'Scan'].includes(action)) {
          res.writeHead(403);
          res.end('{}');
          return;
        }
        const records = rows[input.TableName];
        if (!records) throw new Error('Unknown table');
        res.setHeader('content-type', 'application/x-amz-json-1.0');
        if (action === 'GetItem') {
          const key = unmarshall(input.Key);
          const item = records.find((row) => Object.entries(key).every(([k, v]) => row[k] === v));
          res.end(JSON.stringify(item ? { Item: marshall(item) } : {}));
          return;
        }
        let filtered = [...records];
        if (input.KeyConditionExpression) {
          const field = input.ExpressionAttributeNames['#key'];
          const value = unmarshall(input.ExpressionAttributeValues)[':key'];
          filtered = filtered.filter((row) => row[field] === value);
        }
        const fields = [...new Set([...keys[input.TableName], ...(indexKeys[input.IndexName] ?? [])])];
        if (input.ScanIndexForward === false) filtered.reverse();
        const startKey = input.ExclusiveStartKey ? unmarshall(input.ExclusiveStartKey) : undefined;
        const start = startKey
          ? filtered.findIndex((row) => Object.entries(startKey).every(([k, v]) => row[k] === v)) + 1
          : 0;
        const selected: Row[] = [];
        let bytes = 0;
        for (const row of filtered.slice(start, start + input.Limit)) {
          const length = Buffer.byteLength(JSON.stringify(row));
          if (selected.length && bytes + length > controls.byteLimit) break;
          selected.push(row);
          bytes += length;
        }
        const last = selected.at(-1);
        const hasMore = start + selected.length < filtered.length;
        res.end(
          JSON.stringify({
            Items: selected.map((row) => marshall(row)),
            ...(hasMore && last
              ? {
                  LastEvaluatedKey: marshall(Object.fromEntries(fields.map((field) => [field, last[field]]))),
                }
              : {}),
          }),
        );
        return;
      }
      const url = new URL(req.url!, 'http://fixture');
      const key = decodeURIComponent(url.pathname.replace(/^\/fixture\//, ''));
      calls.push(
        req.method === 'HEAD'
          ? 'HeadObject'
          : url.searchParams.has('list-type')
            ? 'ListObjectsV2'
            : req.method === 'GET'
              ? 'GetObject'
              : 'WRITE',
      );
      if (url.searchParams.has('list-type')) {
        const prefix = url.searchParams.get('prefix')!;
        const after = url.searchParams.get('start-after') ?? '';
        const found = [...objects.keys()].filter((key) => key.startsWith(prefix) && key > after).sort();
        const selected = found.slice(0, Number(url.searchParams.get('max-keys')));
        res.setHeader('content-type', 'application/xml');
        res.end(
          `<ListBucketResult><IsTruncated>${selected.length < found.length}</IsTruncated>${selected.map((key) => `<Contents><Key>${key}</Key><Size>${pdf.length}</Size></Contents>`).join('')}</ListBucketResult>`,
        );
        return;
      }
      const object = objects.get(key);
      if (!object) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader('content-type', object.type);
      res.setHeader('etag', object.etag);
      res.setHeader('last-modified', 'Thu, 01 Jan 2026 00:00:00 GMT');
      res.setHeader('content-length', object.bytes.length);
      res.end(req.method === 'HEAD' ? undefined : object.bytes);
    } catch {
      res.writeHead(500);
      res.end('{}');
    }
  });
  const awsUrl = await listen(aws);
  const credentials = { accessKeyId: 'fixture', secretAccessKey: 'fixture-only' };
  const db = DynamoDBDocumentClient.from(
    new DynamoDBClient({ endpoint: awsUrl, region: 'ap-northeast-1', credentials, maxAttempts: 1 }),
  );
  const s3 = new S3Client({
    endpoint: awsUrl,
    region: 'ap-northeast-1',
    credentials,
    forcePathStyle: true,
    maxAttempts: 1,
  });
  const repo = new LearningRepository(db, s3, 'fixture');
  const mcp = createServer(async (req, res) => {
    const body = await bodyOf(req);
    const input = event(undefined);
    input.body = body;
    input.rawPath = new URL(req.url!, 'http://fixture').pathname;
    input.requestContext.http.method = req.method!;
    input.headers = Object.fromEntries(
      Object.entries(req.headers).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : value,
      ]),
    );
    // 隔離fixtureのみがGateway検証済みcontextを構築する。本番handlerには迂回路を作らない。
    const response = await handle(input, fixtureConfig, repo);
    res.writeHead(response.statusCode!, response.headers as Record<string, string>);
    res.end(response.body);
  });
  const url = await listen(mcp);
  return {
    repo,
    rows,
    objects,
    calls,
    controls,
    url: `${url}/mcp/v1`,
    stop: async () => {
      await close(mcp);
      await close(aws);
      db.destroy();
      s3.destroy();
    },
  };
};
