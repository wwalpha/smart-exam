import { describe, expect, it, vi } from 'vitest';
import { Readable } from 'stream';

// Mock AWS SDK clients used by BedrockService
vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = vi.fn(async () => ({
      Body: new Readable({
        read() {
          this.push(Buffer.from('%PDF-1.4 mock'));
          this.push(null);
        },
      }),
    }));
  }
  class GetObjectCommand {
    constructor(_: any) {}
  }
  return { S3Client, GetObjectCommand };
});

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  class BedrockRuntimeClient {
    send = vi.fn(async () => ({
      output: {
        message: {
          content: [{ text: '{"questions":["1","1-1"]}' }],
        },
      },
    }));
  }
  class ConverseCommand {
    constructor(_: any) {}
  }
  return { BedrockRuntimeClient, ConverseCommand };
});

import { analyzeExamPaper } from '@/services/BedrockService';

describe('BedrockService (unit)', () => {
  it('parses questions JSON from Bedrock response', async () => {
    const questions = await analyzeExamPaper('uploads/mock.pdf', 'math');
    expect(questions).toEqual(['1', '1-1']);
  });
});
