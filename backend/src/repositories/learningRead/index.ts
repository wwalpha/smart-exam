import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  ScanCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, HeadObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Key, Row } from '../../../typings/learningRead';

// SDK境界は読取命令のみを公開し、既存のPDF生成サービスから分離する。
export class LearningRepository {
  constructor(
    readonly db = DynamoDBDocumentClient.from(new DynamoDBClient({ maxAttempts: 3 })),
    readonly s3 = new S3Client({ maxAttempts: 3 }),
    readonly bucket = process.env.FILES_BUCKET_NAME ?? '',
  ) {}
  async get(table: string, key: Key, signal?: AbortSignal): Promise<Row | null> {
    return (
      (
        await this.db.send(new GetCommand({ TableName: table, Key: key, ConsistentRead: true }), {
          abortSignal: signal,
        })
      ).Item ?? null
    );
  }
  async page(input: QueryCommandInput, signal?: AbortSignal) {
    const result = await this.db.send(
      input.KeyConditionExpression ? new QueryCommand(input) : new ScanCommand(input),
      { abortSignal: signal },
    );
    return { items: (result.Items ?? []) as Row[], next: result.LastEvaluatedKey as Key | undefined };
  }
  async files(prefix: string, after?: string, limit = 50, signal?: AbortSignal, continuationToken?: string) {
    return await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        StartAfter: after,
        MaxKeys: limit,
        ContinuationToken: continuationToken,
      }),
      { abortSignal: signal },
    );
  }
  async head(key: string, signal?: AbortSignal) {
    try {
      return await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }), {
        abortSignal: signal,
      });
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
        return null;
      throw error;
    }
  }
  async sign(key: string, versionId?: string) {
    return await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key, VersionId: versionId }),
      { expiresIn: 300 },
    );
  }
}
