import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const createDynamoDbDocumentClient = (): DynamoDBDocumentClient => {
  const client = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(client);
};
