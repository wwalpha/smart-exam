import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js';
import { handle } from '@/mcp/handler';
import { inputs, responseSchema } from '@/mcp/schema';
import { canonical } from '@/services/learningRead/common';
import { event, fixtureConfig, pdf, startFixture } from './fixture';
import type { Row, ToolName } from '../../typings/learningRead';

let fixture: Awaited<ReturnType<typeof startFixture>>;
let client: Client;
let log: ReturnType<typeof vi.spyOn>;
const call = async (name: ToolName, args: Row = {}) => {
  const response = await client.callTool({ name, arguments: args });
  expect(response.isError, JSON.stringify(response.content)).not.toBe(true);
  expect(responseSchema(name).safeParse(response.structuredContent).success).toBe(true);
  return response.structuredContent as {
    data: Row;
    pagination: { nextCursor: string | null; hasMore: boolean };
    quality: { warnings: string[] };
  };
};
const all = async (name: ToolName, args: Row = {}) => {
  const items: Row[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const result = await call(name, { ...args, ...(cursor ? { cursor } : {}) });
    items.push(...(result.data.items as Row[]));
    cursor = result.pagination.nextCursor;
    expect(++pages).toBeLessThan(2000);
  } while (cursor);
  return items;
};
const errorCode = async (name: ToolName, args: Row, code: string) => {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError).toBe(true);
  expect(JSON.parse((result.content as { text: string }[])[0].text).code).toBe(code);
};
beforeEach(async () => {
  log = vi.spyOn(console, 'info').mockImplementation(() => {});
  fixture = await startFixture();
  client = new Client({ name: 'verification-only', version: '1' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(fixture.url), {
      requestInit: { headers: { authorization: 'Bearer fixture-only' } },
    }),
  );
});
afterEach(async () => {
  await client.close();
  await fixture.stop();
  log.mockRestore();
});

describe('SDK Streamable HTTP with isolated AWS HTTP fixtures', () => {
  it('initializes, lists exactly 7 validated read-only tools, and reports the deployed build', async () => {
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name).sort()).toEqual(Object.keys(inputs).sort());
    for (const tool of listed.tools) {
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.outputSchema).toBeDefined();
    }
    const context = await call('get_learning_context');
    expect(context.data.serverVersion).toBe(fixtureConfig.serverVersion);
    expect(context.data.protocols).toEqual(SUPPORTED_PROTOCOL_VERSIONS);
    expect(client.getServerVersion()?.version).toBe(fixtureConfig.serverVersion);
  });
  it.each(SUPPORTED_PROTOCOL_VERSIONS)(
    'SDK negotiates supported protocol %s without a persistent session',
    async (version) => {
      const response = await handle(
        event({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: version,
            capabilities: {},
            clientInfo: { name: 'fixture', version: '1' },
          },
        }),
        fixtureConfig,
        fixture.repo,
      );
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body!).result.protocolVersion).toBe(version);
      expect(response.headers?.['mcp-session-id']).toBeUndefined();
    },
  );
  it('material search → summary → ALL initial results → stored PDF and alternate version', async () => {
    const inventory = await all('search_materials', { pageSize: 1 });
    expect(inventory.map((row) => row.materialId)).toEqual(['m1']);
    const summary = await call('get_material', { materialId: 'm1' });
    expect(summary.data.registeredDate).toBe('2026-01-02');
    const observations = await all('get_material', { materialId: 'm1', view: 'QUESTIONS', pageSize: 1 });
    expect(observations.map((row) => row.result)).toEqual(['CORRECT', 'INCORRECT', 'UNGRADED']);
    expect(observations.map((row) => row.evidenceId)).toEqual(
      fixture.rows.MATERIAL_QUESTIONS.map((row) => `material:m1:question:${row.questionId}:initial`),
    );
    expect(observations.every((row) => row.questionText === null && row.studentAnswer === null)).toBe(true);
    const files = await all('get_material', { materialId: 'm1', view: 'FILES', pageSize: 1 });
    expect(files).toHaveLength(2);
    expect(files.filter((row) => row.selected)).toHaveLength(1);
    const access = await call('get_file_access', { fileRef: files[0].fileRef });
    const url = new URL(String(access.data.url));
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.has('X-Amz-Signature')).toBe(true);
    const downloaded = await fetch(url);
    expect(downloaded.status).toBe(200);
    expect(Buffer.from(await downloaded.arrayBuffer())).toEqual(pdf);
    expect(fixture.calls).toContain('GetObject');
    expect(fixture.calls).not.toContain('WRITE');
  });
  it('MATERIAL exams → original question → multiple separate attempts, plus queue state and lifecycle', async () => {
    const exams = await all('search_exams', { mode: 'MATERIAL', pageSize: 1 });
    expect(exams.map((row) => row.examId)).toEqual(['e1', 'e2']);
    const items = await all('get_exam', { examId: 'e1', view: 'ITEMS', pageSize: 1 });
    expect(items[0]).toMatchObject({
      target: { mode: 'MATERIAL', targetId: 'q0' },
      materialId: 'm1',
      canonicalKey: '(0)',
      questionText: null,
      correctAnswer: 'fixture-answer',
    });
    const history = await all('get_target_learning_history', {
      mode: 'MATERIAL',
      targetId: 'q0',
      pageSize: 1,
    });
    expect(history.map((row) => row.evidenceId)).toEqual([
      'material:m1:question:q0:initial',
      'exam:e1:item:1',
      'exam:e2:item:1',
    ]);
    expect(history[2]).toMatchObject({
      finalizationStatus: 'PROVISIONAL',
      occurredOn: null,
      result: 'INCORRECT',
    });
    const state = await call('get_target_learning_history', {
      mode: 'MATERIAL',
      targetId: 'q0',
      view: 'REVIEW_STATE',
    });
    expect(state.data).toMatchObject({
      state: 'LOCKED',
      correctCount: 1,
      lockedByExamId: 'e2',
      masteryAssessment: 'NOT_PROVIDED',
    });
    const lifecycle = await all('get_target_learning_history', {
      mode: 'MATERIAL',
      targetId: 'q0',
      view: 'LIFECYCLE',
    });
    expect(lifecycle[0]).toMatchObject({
      kind: 'QUEUE_LIFECYCLE',
      record: fixture.rows.EXAM_HISTORIES[0],
      correctCountMeaning: 'RAW_QUEUE_VALUE_NOT_EXAM_RESULT',
    });
    expect(lifecycle[0]).not.toHaveProperty('isCorrect');
  });
  it('KANJI preserves prompt, reading, underline, answer and separate retest evidence', async () => {
    const exams = await all('search_exams', { mode: 'KANJI', pageSize: 1 });
    expect(exams.map((row) => row.examId)).toEqual(['k1', 'k2']);
    const items = await all('get_exam', { examId: 'k1', view: 'ITEMS' });
    expect(items[0]).toMatchObject({
      questionText: 'やまを見る',
      correctAnswer: '山',
      readingHiragana: 'やま',
      underlineSpec: { type: 'promptSpan', start: 0, length: 2 },
    });
    const history = await all('get_target_learning_history', { mode: 'KANJI', targetId: 'w1', pageSize: 1 });
    expect(history.map((row) => row.result)).toEqual(['INCORRECT', 'CORRECT']);
    const files = await all('get_exam', { examId: 'k1', view: 'FILES' });
    expect(files).toHaveLength(1);
  });
  it('missing original date stays UNKNOWN and unfinalized initial result stays PROVISIONAL', async () => {
    delete fixture.rows.MATERIALS[0].registeredDate;
    fixture.rows.MATERIALS[0].isCompleted = false;
    const result = (await all('get_material', { materialId: 'm1', view: 'QUESTIONS' }))[0];
    expect(result).toMatchObject({
      occurredOn: null,
      dateSource: 'UNKNOWN',
      datePrecision: 'UNKNOWN',
      finalizationStatus: 'PROVISIONAL',
      materialDate: '2026-01-01',
    });
  });
  it('retains grading disagreement, missing parents/master, and source-only orphan results', async () => {
    fixture.rows.EXAM_DETAILS[0].isCorrect = false;
    (fixture.rows.EXAMS[0].results as Row[]).push({ id: 'orphan', isCorrect: true });
    const items = await all('get_exam', { examId: 'e1', view: 'ITEMS', pageSize: 1 });
    expect(items[0]).toMatchObject({
      result: 'CONFLICT',
      isCorrect: null,
      rawResults: { examResults: [true], detailResult: false },
    });
    expect(items[1]).toMatchObject({
      kind: 'SOURCE_ONLY',
      seq: null,
      rawResult: { id: 'orphan', isCorrect: true },
    });
    expect((await call('get_exam', { examId: 'e1' })).quality.warnings).toContain('UNMATCHED_RESULT');
    fixture.rows.MATERIAL_QUESTIONS = [];
    fixture.rows.EXAMS = fixture.rows.EXAMS.filter((row) => row.examId !== 'e1');
    const remaining = await all('get_target_learning_history', { mode: 'MATERIAL', targetId: 'q0' });
    expect(remaining).toHaveLength(2);
    expect((remaining[0].quality as Row).warnings).toEqual(
      expect.arrayContaining(['MISSING_PARENT', 'MISSING_TARGET']),
    );
  });
  it('paginates beyond 500 records and DynamoDB byte boundaries without losing any native IDs', async () => {
    fixture.rows.MATERIALS = Array.from({ length: 507 }, (_, n) => ({
      ...fixture.rows.MATERIALS[0],
      materialId: `m${n}`,
      title: 'x'.repeat(2200),
      storageOnlyPadding: 'x'.repeat(20000),
    }));
    const rows = await all('search_materials', { pageSize: 100 });
    expect(rows.map((row) => row.materialId)).toEqual(fixture.rows.MATERIALS.map((row) => row.materialId));
    fixture.rows.EXAM_DETAILS = Array.from({ length: 507 }, (_, n) => ({
      examId: `missing-${n}`,
      seq: 1,
      targetId: 'w1',
      targetType: 'KANJI',
    }));
    fixture.controls.byteLimit = 2000;
    const history = await all('get_target_learning_history', {
      mode: 'KANJI',
      targetId: 'w1',
      pageSize: 100,
    });
    expect(history.map((row) => row.examId)).toEqual(fixture.rows.EXAM_DETAILS.map((row) => row.examId));
  }, 30000);
  it('empty filtered pages keep a cursor and eventually return matching records', async () => {
    fixture.rows.MATERIALS.unshift({ ...fixture.rows.MATERIALS[0], materialId: 'other', subjectId: '1' });
    const first = await call('search_materials', { subject: '4', pageSize: 1 });
    expect(first.data.items).toEqual([]);
    expect(first.pagination.hasMore).toBe(true);
    expect(
      (await all('search_materials', { subject: '4', pageSize: 1 })).map((row) => row.materialId),
    ).toEqual(['m1']);
  });
  it('rejects malformed and cross-filter/view/environment cursors', async () => {
    await errorCode('search_materials', { cursor: 'invalid' }, 'INVALID_CURSOR');
    fixture.rows.MATERIALS.push({ ...fixture.rows.MATERIALS[0], materialId: 'm2' });
    const cursor = (await call('search_materials', { pageSize: 1 })).pagination.nextCursor;
    await errorCode('search_materials', { cursor, subject: '1' }, 'INVALID_CURSOR');
    await errorCode('search_exams', { cursor }, 'INVALID_CURSOR');
    const response = await handle(
      event({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: { name: 'search_materials', arguments: { cursor } },
      }),
      { ...fixtureConfig, environment: 'other' },
      fixture.repo,
    );
    expect(JSON.parse(JSON.parse(response.body!).result.content[0].text).code).toBe('INVALID_CURSOR');
  });
  it('splits a large response at record boundaries, and rejects a single oversized record', async () => {
    fixture.rows.MATERIALS = Array.from({ length: 3 }, (_, n) => ({
      ...fixture.rows.MATERIALS[0],
      materialId: `large${n}`,
      title: 'x'.repeat(60000),
    }));
    expect((await all('search_materials', { pageSize: 100 })).map((row) => row.materialId)).toEqual([
      'large0',
      'large1',
      'large2',
    ]);
    fixture.rows.MATERIALS[0].title = 'x'.repeat(260000);
    await errorCode('search_materials', {}, 'RESPONSE_TOO_LARGE');
  });
  it('hash is stable on reread, changes for a backdated correction, and object property order is irrelevant', async () => {
    const first = (await all('get_exam', { examId: 'e1', view: 'ITEMS' }))[0];
    const second = (await all('get_exam', { examId: 'e1', view: 'ITEMS' }))[0];
    expect(second.evidenceHash).toBe(first.evidenceHash);
    fixture.rows.EXAM_DETAILS[0].isCorrect = false;
    (fixture.rows.EXAMS[0].results as Row[])[0].isCorrect = false;
    const corrected = (await all('get_exam', { examId: 'e1', view: 'ITEMS' }))[0];
    expect(corrected.occurredOn).toBe(first.occurredOn);
    expect(corrected.evidenceHash).not.toBe(first.evidenceHash);
    expect(canonical({ b: 2, a: 1 })).toBe(canonical({ a: 1, b: 2 }));
    expect(canonical([1, 2])).not.toBe(canonical([2, 1]));
  });
  it('does not infer mastery from absent candidates, and distinguishes excluded/inconsistent states', async () => {
    fixture.rows.EXAM_CANDIDATES = [];
    expect(
      (await call('get_target_learning_history', { mode: 'MATERIAL', targetId: 'q0', view: 'REVIEW_STATE' }))
        .data,
    ).toMatchObject({ state: 'NO_ACTIVE_CANDIDATE', correctCount: null, nextTime: null });
    fixture.rows.EXAM_HISTORIES[0].status = 'EXCLUDED';
    expect(
      (await call('get_target_learning_history', { mode: 'MATERIAL', targetId: 'q0', view: 'REVIEW_STATE' }))
        .data.state,
    ).toBe('EXCLUDED');
    fixture.rows.EXAM_CANDIDATES = [1, 2].map((n) => ({
      id: `c${n}`,
      subject: '4',
      candidateKey: `c${n}`,
      questionId: 'q0',
      mode: 'MATERIAL',
      status: 'OPEN',
      createdAt: `2026-01-0${n}`,
    }));
    expect(
      (await call('get_target_learning_history', { mode: 'MATERIAL', targetId: 'q0', view: 'REVIEW_STATE' }))
        .data.state,
    ).toBe('INCONSISTENT');
  });
  it('missing PDFs never generate/write, and file refs reject changed, missing and forged owners', async () => {
    const missing = await call('get_exam', { examId: 'e1', view: 'FILES' });
    expect(missing.data).toMatchObject({ items: [], availability: 'NOT_GENERATED' });
    const files = await all('get_material', { materialId: 'm1', view: 'FILES' });
    const token = files.find((row) => row.selected)!.fileRef;
    fixture.objects.get('materials/m1/QUESTION/pdf1')!.etag = '"changed"';
    await errorCode('get_file_access', { fileRef: token }, 'FILE_CHANGED');
    fixture.objects.delete('materials/m1/QUESTION/pdf1');
    await errorCode('get_file_access', { fileRef: token }, 'FILE_NOT_GENERATED');
    fixture.rows.MATERIALS = [];
    await errorCode('get_file_access', { fileRef: token }, 'NOT_FOUND');
    await errorCode('get_file_access', { fileRef: 'forged' }, 'NOT_FOUND');
    expect(
      fixture.calls.every((call) =>
        ['GetItem', 'Query', 'Scan', 'ListObjectsV2', 'HeadObject', 'GetObject'].includes(call),
      ),
    ).toBe(true);
  });
  it('returns safe business errors for upstream outage without leaking data or credentials', async () => {
    await all('get_material', { materialId: 'm1', view: 'QUESTIONS' });
    const files = await all('get_material', { materialId: 'm1', view: 'FILES' });
    await call('get_file_access', { fileRef: files[0].fileRef });
    fixture.controls.fail = true;
    await errorCode('search_materials', {}, 'UPSTREAM_UNAVAILABLE');
    const logs = JSON.stringify(log.mock.calls);
    for (const value of ['fixture-answer', 'fixture-title', 'fixture-only', 'X-Amz', 'やま', 'CORRECT'])
      expect(logs).not.toContain(value);
  });
  it('rejects invalid input schema, arbitrary file URLs and unsupported HTTP methods', async () => {
    for (const args of [
      { materialId: 'm1', extra: true },
      { materialId: 'm1', pageSize: 101 },
      { materialId: 'bad\nvalue' },
    ])
      expect((await client.callTool({ name: 'get_material', arguments: args })).isError).toBe(true);
    expect(
      (
        await client.callTool({
          name: 'search_materials',
          arguments: { dateRange: { field: 'registeredDate', from: '2026-02-30', to: '2026-03-01' } },
        })
      ).isError,
    ).toBe(true);
    expect(
      (await client.callTool({ name: 'get_file_access', arguments: { fileRef: 'x', key: 'secret' } }))
        .isError,
    ).toBe(true);
    for (const method of ['GET', 'DELETE']) {
      const input = event({});
      input.requestContext.http.method = method;
      expect((await handle(input, fixtureConfig, fixture.repo)).statusCode).toBe(405);
    }
  });
  it('requires authorization in every environment and rejects wrong scope/audience/client/use/user/origin/expiry', async () => {
    const request = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
    const missing = event(request);
    delete missing.headers.authorization;
    expect((await handle(missing, fixtureConfig, fixture.repo)).statusCode).toBe(401);
    for (const [key, value] of Object.entries({
      scope: 'openid',
      aud: 'web-client',
      client_id: 'web-client',
      iss: 'other',
      token_use: 'id',
      sub: 'unapproved',
      exp: 0,
    })) {
      const input = event(request);
      input.requestContext.authorizer.jwt.claims[key] = value;
      expect((await handle(input, fixtureConfig, fixture.repo)).statusCode).toBe(403);
    }
    const badOrigin = event(request);
    badOrigin.headers.origin = 'https://evil.invalid';
    expect((await handle(badOrigin, fixtureConfig, fixture.repo)).statusCode).toBe(403);
    const group = event(request);
    group.requestContext.authorizer.jwt.claims.sub = 'group-user';
    group.requestContext.authorizer.jwt.claims['cognito:groups'] = '[MCP_READERS]';
    expect((await handle(group, fixtureConfig, fixture.repo)).statusCode).toBe(200);
    const discovery = event(undefined, {
      rawPath: '/.well-known/oauth-protected-resource/mcp/v1',
      headers: {},
    });
    discovery.requestContext.http.method = 'GET';
    expect(JSON.parse((await handle(discovery, fixtureConfig, fixture.repo)).body!).resource).toBe(
      fixtureConfig.endpoint,
    );
  });
});
