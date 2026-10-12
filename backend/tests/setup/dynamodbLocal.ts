import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

type DynamoLocal = {
  endpoint: string;
  container: StartedTestContainer | null;
  client: DynamoDBClient;
  docClient: DynamoDBDocumentClient;
};

let cached: Promise<DynamoLocal> | null = null;

const ensureEnvForLocal = (endpoint: string) => {
  process.env.AWS_ENDPOINT_URL = endpoint;
  process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || 'ap-northeast-1';
  process.env.AWS_ACCESS_KEY_ID = 'test';
  process.env.AWS_SECRET_ACCESS_KEY = 'test';
};

const createTables = async (client: DynamoDBClient) => {
  const create = async (command: CreateTableCommand) => {
    try {
      await client.send(command);
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'name' in error) {
        const maybeName = (error as { name?: unknown }).name;
        if (maybeName === 'ResourceInUseException') return;
      }
      throw error;
    }
  };

  await create(
    new CreateTableCommand({
      TableName: 'material_questions',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'questionId', AttributeType: 'S' },
        { AttributeName: 'materialId', AttributeType: 'S' },
        { AttributeName: 'number', AttributeType: 'N' },
      ],
      KeySchema: [{ AttributeName: 'questionId', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'gsi_material_id_number',
          KeySchema: [
            { AttributeName: 'materialId', KeyType: 'HASH' },
            { AttributeName: 'number', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    }),
  );

  await create(
    new CreateTableCommand({
      TableName: 'kanji',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'wordId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'wordId', KeyType: 'HASH' }],
    }),
  );

  await create(
    new CreateTableCommand({
      TableName: 'test_candidates',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'subject', AttributeType: 'S' },
        { AttributeName: 'candidateKey', AttributeType: 'S' },
        { AttributeName: 'questionId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'materialId', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'subject', KeyType: 'HASH' },
        { AttributeName: 'candidateKey', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        { IndexName: 'gsi_subject_next_time', KeySchema: [{ AttributeName: 'subject', KeyType: 'HASH' }, { AttributeName: 'candidateKey', KeyType: 'RANGE' }], Projection: { ProjectionType: 'ALL' } },
        { IndexName: 'gsi_question_id_created_at', KeySchema: [{ AttributeName: 'questionId', KeyType: 'HASH' }, { AttributeName: 'createdAt', KeyType: 'RANGE' }], Projection: { ProjectionType: 'ALL' } },
        { IndexName: 'gsi_material_id_status', KeySchema: [{ AttributeName: 'materialId', KeyType: 'HASH' }, { AttributeName: 'status', KeyType: 'RANGE' }], Projection: { ProjectionType: 'KEYS_ONLY' } },
      ],
    }),
  );

  await create(new CreateTableCommand({
    TableName: 'exams', BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [{ AttributeName: 'examId', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'examId', KeyType: 'HASH' }],
  }));
  await create(new CreateTableCommand({
    TableName: 'exam_details', BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [{ AttributeName: 'examId', AttributeType: 'S' }, { AttributeName: 'seq', AttributeType: 'N' }, { AttributeName: 'targetId', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'examId', KeyType: 'HASH' }, { AttributeName: 'seq', KeyType: 'RANGE' }],
    GlobalSecondaryIndexes: [{ IndexName: 'gsi_target_id_exam_id', KeySchema: [{ AttributeName: 'targetId', KeyType: 'HASH' }, { AttributeName: 'examId', KeyType: 'RANGE' }], Projection: { ProjectionType: 'ALL' } }],
  }));
  await create(new CreateTableCommand({
    TableName: 'exam_histories', BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }, { AttributeName: 'questionId', AttributeType: 'S' }, { AttributeName: 'closedAt', AttributeType: 'S' }],
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    GlobalSecondaryIndexes: [{ IndexName: 'gsi_question_id_closed_at', KeySchema: [{ AttributeName: 'questionId', KeyType: 'HASH' }, { AttributeName: 'closedAt', KeyType: 'RANGE' }], Projection: { ProjectionType: 'ALL' } }],
  }));

  await create(
    new CreateTableCommand({
      TableName: 'tests',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'testId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'testId', KeyType: 'HASH' }],
    }),
  );

  await create(
    new CreateTableCommand({
      TableName: 'materials',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'materialId', AttributeType: 'S' },
        { AttributeName: 'subjectId', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'materialId', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'gsi_subject_id',
          KeySchema: [
            { AttributeName: 'subjectId', KeyType: 'HASH' },
            { AttributeName: 'materialId', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    }),
  );

  await create(
    new CreateTableCommand({
      TableName: 'exam_papers',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'paperId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'paperId', KeyType: 'HASH' }],
    }),
  );

  await create(
    new CreateTableCommand({
      TableName: 'exam_results',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'resultId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'resultId', KeyType: 'HASH' }],
    }),
  );
};

export const getDynamoDbLocal = async (): Promise<DynamoLocal> => {
  if (!cached) {
    cached = (async () => {
      const external = process.env.DDB_LOCAL_ENDPOINT;
      if (external && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(external).hostname)) throw new Error('DDB_LOCAL_ENDPOINT must be loopback');
      const container = external ? null : await new GenericContainer('amazon/dynamodb-local').withExposedPorts(8000).start();
      const endpoint = external ?? `http://${container!.getHost()}:${container!.getMappedPort(8000)}`;
      ensureEnvForLocal(endpoint);

      const client = new DynamoDBClient({
        region: process.env.AWS_DEFAULT_REGION,
        endpoint,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
        },
      });
      const docClient = DynamoDBDocumentClient.from(client);

      await createTables(client);

      return { endpoint, container, client, docClient };
    })();
  }

  return cached;
};

export const stopDynamoDbLocal = async (): Promise<void> => {
  if (!cached) return;
  const local = await cached;
  await local.container?.stop();
  cached = null;
};
