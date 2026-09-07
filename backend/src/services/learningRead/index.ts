import { SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js';
import type { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import type { Input, Key, Position, ReadContext, Row, ToolName } from '../../../typings/learningRead';
import { inputs } from '@/mcp/schema';
import {
  binding,
  bool,
  checkTime,
  collection,
  freshQuality,
  get,
  hash,
  num,
  position,
  ReadError,
  ref,
  seal,
  signal,
  str,
  table,
  warn,
} from './common';
import { observe } from './observations';
import { accessFile, fileInfo, safeOwnerId } from './files';

export const materialMetadata = (row: Row) => ({
  materialId: row.materialId,
  title: str(row.title),
  subject: str(row.subjectId),
  provider: str(row.provider),
  grade: str(row.grade),
  materialDate: str(row.materialDate),
  registeredDate: str(row.registeredDate),
  isCompleted: bool(row.isCompleted),
  questionCount: num(row.questionCount),
  metadataHash: hash(row),
});
export const examMetadata = (row: Row) => ({
  examId: row.examId,
  mode: str(row.mode),
  subject: str(row.subject),
  status: str(row.status),
  createdDate: str(row.createdDate),
  submittedDate: str(row.submittedDate),
  count: num(row.count),
  metadataHash: hash(row),
});
const query = (name: string, field: string, value: string, index?: string): QueryCommandInput => ({
  TableName: table(name),
  IndexName: index,
  KeyConditionExpression: '#key = :key',
  ExpressionAttributeNames: { '#key': field },
  ExpressionAttributeValues: { ':key': value },
});
const rowKey = (row: Row, fields: string[]): Key => {
  const key: Key = {};
  for (const field of fields)
    if (typeof row[field] === 'string' || typeof row[field] === 'number')
      key[field] = row[field] as string | number;
  return key;
};
const matches = (row: Row, input: Input): boolean => {
  for (const field of ['subject', 'provider', 'grade', 'isCompleted', 'mode', 'status']) {
    const expected = (input as Row)[field];
    if (
      expected !== undefined &&
      (field === 'subject'
        ? (row.subjectId ?? row.subject)
        : field === 'mode'
          ? (row.mode ?? row.targetType)
          : row[field]) !== expected
    )
      return false;
  }
  if ('dateRange' in input && input.dateRange) {
    const range = input.dateRange;
    const date = str(row[range.field]);
    if (!date) return range.includeUndated;
    if (date < range.from || date > range.to) return false;
  }
  return true;
};
const fits = (items: unknown[]) => Buffer.byteLength(JSON.stringify(items)) < 110_000;
const pageRows = async (
  ctx: ReadContext,
  input: Input,
  at: Position,
  spec: QueryCommandInput,
  keys: string[],
  transform: 'material' | 'exam' | 'initial' | 'detail' | 'lifecycle',
  parent: Row | null = null,
) => {
  const pageSize = 'pageSize' in input ? input.pageSize : 50;
  const page = await ctx.repo.page({ ...spec, ExclusiveStartKey: at.key, Limit: pageSize }, signal(ctx));
  const items: unknown[] = [];
  let last = at.key;
  for (const row of page.items) {
    if (Date.now() >= ctx.deadline - 1000) return { data: collection(items), next: { ...at, key: last } };
    if (
      !matches(row, input) ||
      ('mode' in input && transform === 'detail' && row.targetType !== input.mode)
    ) {
      last = rowKey(row, keys);
      continue;
    }
    let value: unknown;
    if (transform === 'material') value = materialMetadata(row);
    else if (transform === 'exam') value = examMetadata(row);
    else if (transform === 'lifecycle')
      value = {
        kind: 'QUEUE_LIFECYCLE',
        record: {
          id: row.id,
          subject: str(row.subject),
          questionId: row.questionId,
          mode: row.mode,
          status: row.status,
          correctCount: num(row.correctCount),
          nextTime: str(row.nextTime),
          closedAt: str(row.closedAt),
        },
        correctCountMeaning: 'RAW_QUEUE_VALUE_NOT_EXAM_RESULT',
        sourceRefs: [ref('EXAM_HISTORY', String(row.id))],
      };
    else
      value = await observe(
        ctx,
        row,
        transform === 'initial'
          ? null
          : (parent ?? (await get(ctx, 'EXAMS', { examId: String(row.examId) }))),
        transform === 'initial',
      );
    if (!fits([...items, value])) {
      if (!items.length) throw new ReadError('RESPONSE_TOO_LARGE');
      return { data: collection(items), next: { ...at, key: last } };
    }
    items.push(value);
    last = rowKey(row, keys);
  }
  return { data: collection(items), next: page.next ? { ...at, key: page.next } : null };
};
const reviewState = async (ctx: ReadContext, input: { mode: string; targetId: string }) => {
  const active: Row[] = [];
  let key: Key | undefined;
  do {
    checkTime(ctx);
    const page = await ctx.repo.page(
      {
        ...query('EXAM_CANDIDATES', 'questionId', input.targetId, 'gsi_question_id_created_at'),
        ExclusiveStartKey: key,
        Limit: 100,
      },
      signal(ctx),
    );
    for (const row of page.items)
      if (row.mode === input.mode && !row.closedAt && ['OPEN', 'LOCKED'].includes(String(row.status))) {
        active.push(row);
      }
    key = page.next;
  } while (key);
  let latest: Row | undefined;
  if (!active.length) {
    do {
      checkTime(ctx);
      const page = await ctx.repo.page(
        {
          ...query('EXAM_HISTORIES', 'questionId', input.targetId, 'gsi_question_id_closed_at'),
          ScanIndexForward: false,
          ExclusiveStartKey: key,
          Limit: 100,
        },
        signal(ctx),
      );
      for (const row of page.items) if (row.mode === input.mode && !latest) latest = row;
      key = page.next;
    } while (key && !latest);
  }
  const authoritative =
    active.length === 1
      ? active[0]
      : active.length === 0 && latest?.status === 'EXCLUDED'
        ? latest
        : undefined;
  const sourceRefs = [];
  for (const row of active) sourceRefs.push(ref('EXAM_CANDIDATE', String(row.id)));
  if (latest) sourceRefs.push(ref('EXAM_HISTORY', String(latest.id)));
  return {
    target: input,
    state: active.length > 1 ? 'INCONSISTENT' : (authoritative?.status ?? 'NO_ACTIVE_CANDIDATE'),
    correctCount: num(authoritative?.correctCount),
    nextTime: str(authoritative?.nextTime),
    lockedByExamId: str(authoritative?.examId),
    sourceRefs,
    masteryAssessment: 'NOT_PROVIDED',
  };
};
const filePage = async (
  ctx: ReadContext,
  kind: 'MATERIAL' | 'EXAM',
  owner: Row,
  at: Position,
  size: number,
) => {
  const id = String(kind === 'MATERIAL' ? owner.materialId : owner.examId);
  safeOwnerId(id);
  if (kind === 'EXAM') {
    const info = await fileInfo(ctx, kind, owner, str(owner.pdfS3Key) ?? `exams/${id}.pdf`);
    return { data: collection(info ? [info] : [], info ? 'AVAILABLE' : 'NOT_GENERATED'), next: null };
  }
  const page = await ctx.repo.files(`materials/${id}/`, at.after, size, signal(ctx), at.s3Token);
  const items = [];
  let after = at.after;
  for (const object of page.Contents ?? []) {
    if (Date.now() >= ctx.deadline - 1000) return { data: collection(items), next: after ? { after } : at };
    const key = object.Key!;
    if (!['QUESTION', 'ANSWER', 'GRADED_ANSWER'].includes(key.split('/')[2]) || key.endsWith('/')) {
      after = key;
      continue;
    }
    const info = await fileInfo(ctx, kind, owner, key);
    if (info && !fits([...items, info])) {
      if (!items.length) throw new ReadError('RESPONSE_TOO_LARGE');
      return { data: collection(items), next: after ? { after } : at };
    }
    if (info) items.push(info);
    after = key;
  }
  return {
    data: collection(items),
    next: page.IsTruncated
      ? page.NextContinuationToken
        ? { s3Token: page.NextContinuationToken }
        : { after }
      : null,
  };
};
// 孤立したExam.resultsは明細のseqを捏造せず、独立した診断ページに保持する。
const orphanPage = async (ctx: ReadContext, exam: Row, at: Position, size: number) => {
  const items = [];
  const results = (exam.results ?? []) as { id: string; isCorrect: boolean }[];
  const targets = new Set<string>();
  let key: Key | undefined;
  do {
    checkTime(ctx);
    const page = await ctx.repo.page(
      { ...query('EXAM_DETAILS', 'examId', String(exam.examId)), ExclusiveStartKey: key, Limit: 100 },
      signal(ctx),
    );
    for (const detail of page.items) {
      targets.add(String(detail.targetId));
      if (detail.targetType !== exam.mode) warn(ctx, 'MODE_MISMATCH');
      for (const result of results)
        if (
          result.id === detail.targetId &&
          typeof detail.isCorrect === 'boolean' &&
          result.isCorrect !== detail.isCorrect
        )
          warn(ctx, 'GRADING_CONFLICT');
    }
    key = page.next;
  } while (key);
  let offset = at.offset ?? 0;
  for (; offset < results.length; offset++) {
    checkTime(ctx);
    const result = results[offset];
    if (targets.has(result.id)) continue;
    warn(ctx, 'UNMATCHED_RESULT');
    const quality = freshQuality();
    quality.warnings.push('UNMATCHED_RESULT');
    const value = {
      kind: 'SOURCE_ONLY',
      examId: exam.examId,
      seq: null,
      rawResult: result,
      sourceRefs: [ref('EXAM', String(exam.examId), `results[${offset}]`)],
      quality,
      evidenceId: `exam:${exam.examId}:source-result:${offset}`,
    };
    const item = { ...value, evidenceHash: hash(value) };
    if (!fits([...items, item])) {
      if (!items.length) throw new ReadError('RESPONSE_TOO_LARGE');
      break;
    }
    items.push(item);
    if (items.length >= size) {
      offset++;
      break;
    }
  }
  return { data: collection(items), next: offset < results.length ? { phase: 'orphans', offset } : null };
};
export const read = async (ctx: ReadContext, tool: ToolName, raw: unknown) => {
  const input = inputs[tool].parse(raw);
  const at = position(ctx, tool, input);
  let result: { data: unknown; next: Position | null };
  if (tool === 'get_learning_context')
    result = {
      data: {
        environment: ctx.config.environment,
        businessTimezone: 'Asia/Tokyo',
        subjects: { '1': '国語', '2': '理科', '3': '社会', '4': '算数' },
        contractVersion: '1.0.0',
        serverVersion: ctx.config.serverVersion,
        protocols: SUPPORTED_PROTOCOL_VERSIONS,
        capabilities: {
          existingMaterialFiles: true,
          storedExamFiles: true,
          targetHistory: true,
          supplementalReports: false,
          changeTracking: false,
        },
        limitations: [
          'LIVE_NOT_SNAPSHOT',
          'CURRENT_MASTER_NOT_HISTORICAL',
          'TARGET_HISTORY_REQUIRES_EXAM_INVENTORY_FOR_ORPHANS',
          'NO_MASTERY_ASSESSMENT',
          'NO_CHANGE_FEED',
        ],
      },
      next: null,
    };
  else if ('fileRef' in input) result = { data: await accessFile(ctx, input.fileRef), next: null };
  else if (tool === 'search_materials' || tool === 'search_exams')
    result = await pageRows(
      ctx,
      input,
      at,
      { TableName: table(tool === 'search_materials' ? 'MATERIALS' : 'EXAMS') },
      [tool === 'search_materials' ? 'materialId' : 'examId'],
      tool === 'search_materials' ? 'material' : 'exam',
    );
  else if ('materialId' in input) {
    const parent = await get(ctx, 'MATERIALS', { materialId: input.materialId });
    if (input.view === 'QUESTIONS') {
      if (!parent) warn(ctx, 'MISSING_PARENT');
      result = await pageRows(
        ctx,
        input,
        at,
        query('MATERIAL_QUESTIONS', 'materialId', input.materialId, 'gsi_material_id_number'),
        ['questionId', 'materialId', 'number'],
        'initial',
      );
    } else {
      if (!parent) throw new ReadError('NOT_FOUND');
      if (input.view === 'SUMMARY' && input.cursor) throw new ReadError('INVALID_CURSOR');
      result =
        input.view === 'FILES'
          ? await filePage(ctx, 'MATERIAL', parent, at, input.pageSize)
          : { data: materialMetadata(parent), next: null };
    }
  } else if ('examId' in input) {
    const parent = await get(ctx, 'EXAMS', { examId: input.examId });
    if (input.view === 'ITEMS') {
      if (!parent) warn(ctx, 'MISSING_PARENT');
      if (at.phase === 'orphans' && parent) result = await orphanPage(ctx, parent, at, input.pageSize);
      else {
        result = await pageRows(
          ctx,
          input,
          at,
          query('EXAM_DETAILS', 'examId', input.examId),
          ['examId', 'seq'],
          'detail',
          parent,
        );
        if (!result.next && parent && (parent.results as unknown[] | undefined)?.length)
          result.next = { phase: 'orphans', offset: 0 };
      }
    } else {
      if (!parent) throw new ReadError('NOT_FOUND');
      if (input.view === 'SUMMARY') {
        if (input.cursor) throw new ReadError('INVALID_CURSOR');
        await orphanPage(ctx, parent, {}, 1);
        result = { data: examMetadata(parent), next: null };
      } else result = await filePage(ctx, 'EXAM', parent, at, input.pageSize);
    }
  } else if ('targetId' in input) {
    if (input.view === 'REVIEW_STATE') {
      if (input.cursor) throw new ReadError('INVALID_CURSOR');
      result = { data: await reviewState(ctx, { mode: input.mode, targetId: input.targetId }), next: null };
    } else if (input.view === 'LIFECYCLE')
      result = await pageRows(
        ctx,
        input,
        at,
        query('EXAM_HISTORIES', 'questionId', input.targetId, 'gsi_question_id_closed_at'),
        ['id', 'questionId', 'closedAt'],
        'lifecycle',
      );
    else if (!at.phase && input.mode === 'MATERIAL') {
      const question = await get(ctx, 'MATERIAL_QUESTIONS', { questionId: input.targetId });
      result = {
        data: collection(question ? [await observe(ctx, question, null, true)] : []),
        next: { phase: 'details' },
      };
      if (!question) warn(ctx, 'MISSING_TARGET');
    } else
      result = await pageRows(
        ctx,
        input,
        { ...at, phase: 'details' },
        query('EXAM_DETAILS', 'targetId', input.targetId, 'gsi_target_id_exam_id'),
        ['examId', 'seq', 'targetId'],
        'detail',
      );
  } else throw new ReadError('NOT_FOUND');
  const nextCursor = result.next ? seal(ctx, binding(tool, input), result.next) : null;
  return {
    contractVersion: '1.0.0',
    environment: ctx.config.environment,
    serverVersion: ctx.config.serverVersion,
    requestId: ctx.requestId,
    observedAt: ctx.observedAt,
    data: result.data,
    pagination: { nextCursor, hasMore: nextCursor !== null },
    quality: ctx.quality,
  };
};
