import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import type {
  GetObjectCommandOutput,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { s3Client } from './aws';

const hasTransformToByteArray = (body: unknown): body is { transformToByteArray: () => Promise<Uint8Array> } => {
  if (typeof body !== 'object' || body === null) return false;
  const obj = body as Record<string, unknown>;
  return typeof obj.transformToByteArray === 'function';
};

const hasGetReader = (body: unknown): body is ReadableStream<Uint8Array> => {
  if (typeof body !== 'object' || body === null) return false;
  const obj = body as Record<string, unknown>;
  return typeof obj.getReader === 'function';
};

const nodeStreamToBuffer = async (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

const webStreamToBuffer = async (stream: ReadableStream<Uint8Array>): Promise<Buffer> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return Buffer.from(merged);
};

const s3BodyToBuffer = async (body: unknown): Promise<Buffer> => {
  if (body instanceof Readable) {
    return nodeStreamToBuffer(body);
  }

  if (hasTransformToByteArray(body)) {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  if (hasGetReader(body)) {
    return webStreamToBuffer(body);
  }

  throw new Error('Unsupported S3 body stream type');
};

export const AwsUtils = {
  getPresignedPutUrl: async (params: {
    bucket: string;
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string> => {
    const input: PutObjectCommandInput = {
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
    };
    const command = new PutObjectCommand(input);
    return getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds ?? 3600 });
  },

  listS3ObjectsByPrefix: async (params: { bucket: string; prefix: string }): Promise<ListObjectsV2CommandOutput> => {
    const input: ListObjectsV2CommandInput = {
      Bucket: params.bucket,
      Prefix: params.prefix,
    };
    return s3Client.send(new ListObjectsV2Command(input));
  },

  getS3Object: async (params: { bucket: string; key: string }): Promise<GetObjectCommandOutput> => {
    return s3Client.send(
      new GetObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
      })
    );
  },

  getS3ObjectBuffer: async (params: {
    bucket: string;
    key: string;
  }): Promise<{ buffer: Buffer; contentType?: string }> => {
    const response = await AwsUtils.getS3Object(params);
    if (!response.Body) {
      throw new Error('Empty file body from S3');
    }
    const buffer = await s3BodyToBuffer(response.Body);
    return { buffer, contentType: response.ContentType };
  },

  deleteS3Prefix: async (params: { bucket: string; prefix: string }): Promise<void> => {
    let continuationToken: string | undefined = undefined;

    while (true) {
      const response: ListObjectsV2CommandOutput = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: params.bucket,
          Prefix: params.prefix,
          ContinuationToken: continuationToken,
        })
      );

      const keys = (response.Contents ?? []).map((obj) => obj.Key).filter((k): k is string => !!k);

      if (keys.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: params.bucket,
            Delete: {
              Objects: keys.map((key) => ({ Key: key })),
              Quiet: true,
            },
          })
        );
      }

      if (!response.IsTruncated || !response.NextContinuationToken) break;
      continuationToken = response.NextContinuationToken;
    }
  },
};
