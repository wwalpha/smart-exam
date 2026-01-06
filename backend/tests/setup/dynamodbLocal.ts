import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';

type DynamoLocal = {
  endpoint: string;
  container: StartedTestContainer;
  client: DynamoDBClient;
  docClient: DynamoDBDocumentClient;
};

let cached: Promise<DynamoLocal> | null = null;

const ensureEnvForLocal = (endpoint: string) => {
  process.env.AWS_ENDPOINT_URL = endpoint;
  process.env.AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION || 'ap-northeast-1';
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test';
};

const createTables = async (client: DynamoDBClient) => {
  const create = async (command: CreateTableCommand) => {
    try {
      await client.send(command);
    } catch (error: any) {
      if (error?.name === 'ResourceInUseException') return;
      throw error;
    }
  };

  await create(
    new CreateTableCommand({
      TableName: 'attempts',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'attemptId', AttributeType: 'S' },
        { AttributeName: 'testId', AttributeType: 'S' },
        { AttributeName: 'startedAt', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'attemptId', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'gsi_test_id_started_at',
          KeySchema: [
            { AttributeName: 'testId', KeyType: 'HASH' },
            { AttributeName: 'startedAt', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
    })
  );

  await create(
    new CreateTableCommand({
      TableName: 'questions',
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
    })
  );

  await create(
    new CreateTableCommand({
      TableName: 'word_tests',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'wordTestId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'wordTestId', KeyType: 'HASH' }],
    })
  );

  await create(
    new CreateTableCommand({
      TableName: 'words',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'wordId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'wordId', KeyType: 'HASH' }],
    })
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
    })
  );

  await create(
    new CreateTableCommand({
      TableName: 'exam_papers',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'paperId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'paperId', KeyType: 'HASH' }],
    })
  );

  await create(
    new CreateTableCommand({
      TableName: 'exam_results',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [{ AttributeName: 'resultId', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'resultId', KeyType: 'HASH' }],
    })
  );
};

export const getDynamoDbLocal = async (): Promise<DynamoLocal> => {
  if (!cached) {
    cached = (async () => {
      const container = await new GenericContainer('amazon/dynamodb-local')
        .withExposedPorts(8000)
        .start();

      const endpoint = `http://${container.getHost()}:${container.getMappedPort(8000)}`;
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
  await local.container.stop();
  cached = null;
};
