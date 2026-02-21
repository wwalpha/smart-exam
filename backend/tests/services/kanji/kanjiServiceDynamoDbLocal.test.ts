import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

import { getDynamoDbLocal, stopDynamoDbLocal } from '../../setup/dynamodbLocal';

const runDynamoDbLocalTest = process.env.DDB_LOCAL_INTEGRATION === '1';

describe.runIf(runDynamoDbLocalTest)('KanjiService with DynamoDB Local', () => {
  let docClient: Awaited<ReturnType<typeof getDynamoDbLocal>>['docClient'];
  let isDynamoDbLocalAvailable = true;

  beforeAll(async () => {
    try {
      const local = await getDynamoDbLocal();
      docClient = local.docClient;
    } catch (error) {
      isDynamoDbLocalAvailable = false;
      console.warn('[KanjiServiceDynamoDbLocal] DynamoDB Local を起動できないためテストをスキップします', error);
    }
  });

  afterAll(async () => {
    if (!isDynamoDbLocalAvailable) return;
    await stopDynamoDbLocal();
  });

  it('regist/get/list/search を DynamoDB Local で実行できる', async () => {
    if (!isDynamoDbLocalAvailable) return;

    const { createKanjiService } = await import('@/services/kanji');
    const { KanjiRepository } = await import('@/repositories/kanji');
    const { ExamCandidatesRepository } = await import('@/repositories/examCandidates');

    const repositories = {
      kanji: KanjiRepository,
      examCandidates: ExamCandidatesRepository,
      bedrock: {
        analyzeExamPaper: vi.fn(),
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({ id: x.id, readingHiragana: 'しけん' })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);
    const created = await service.registKanji({
      kanji: `しけんのれんしゅう${Date.now()}`,
      reading: 'しけん',
      subject: '1',
    });

    expect(created.id).toBeTruthy();

    const got = await service.getKanji(created.id);
    expect(got).not.toBeNull();
    expect(got?.kanji).toBe(created.kanji);

    const listed = await service.listKanji();
    expect(listed.some((x) => x.id === created.id)).toBe(true);

    const searched = await service.searchKanji({ q: 'しけんのれんしゅう', reading: 'しけん', subject: '1' });
    expect(searched.items.some((x) => x.id === created.id)).toBe(true);

    const candidateScan = await docClient.send(
      new ScanCommand({
        TableName: 'test_candidates',
        FilterExpression: '#questionId = :questionId',
        ExpressionAttributeNames: { '#questionId': 'questionId' },
        ExpressionAttributeValues: { ':questionId': created.id },
      }),
    );

    expect(candidateScan.Items?.length).toBe(1);
    expect(candidateScan.Items?.[0]?.status).toBe('OPEN');
  });

  it('updateKanji で問題文/解答更新時に読み情報を再生成する', async () => {
    if (!isDynamoDbLocalAvailable) return;

    const { createKanjiService } = await import('@/services/kanji');
    const { KanjiRepository } = await import('@/repositories/kanji');
    const { ExamCandidatesRepository } = await import('@/repositories/examCandidates');

    const repositories = {
      kanji: KanjiRepository,
      examCandidates: ExamCandidatesRepository,
      bedrock: {
        analyzeExamPaper: vi.fn(),
        generateKanjiQuestionReadingsBulk: vi
          .fn()
          .mockImplementation(async (params: { items: Array<{ id: string }> }) => {
            return {
              items: params.items.map((x) => ({
                id: x.id,
                readingHiragana: 'こうしん',
              })),
            };
          }),
      },
    } as unknown as Repositories;

    const service = createKanjiService(repositories);
    const created = await service.registKanji({
      kanji: `しょきのもんだい${Date.now()}`,
      reading: 'しょき',
      subject: '2',
    });

    const updated = await service.updateKanji(created.id, {
      kanji: 'こうしんするもんだい',
      reading: 'こうしん',
      subject: '2',
    });

    expect(updated).not.toBeNull();
    expect(updated?.kanji).toBe('こうしんするもんだい');
    expect(updated?.reading).toBe('こうしん');

    const dbItem = await KanjiRepository.get(created.id);
    expect(dbItem).not.toBeNull();
    expect(dbItem?.readingHiragana).toBe('こうしん');
    expect(dbItem?.underlineSpec).toEqual({ type: 'promptSpan', start: 0, length: 4 });
  });
});
