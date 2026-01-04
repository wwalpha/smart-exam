import { S3Client } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { DynamodbHelper } from '@alphax/dynamodb';
import { ENV } from './env';

// DynamoDB
export const dbHelper = new DynamodbHelper();

// S3
export const s3Client = new S3Client({ region: ENV.AWS_REGION });

// Bedrock
export const bedrockClient = new BedrockRuntimeClient({ region: ENV.BEDROCK_REGION });
