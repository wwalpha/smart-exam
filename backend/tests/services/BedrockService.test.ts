import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  ENV: {
    FILES_BUCKET_NAME: 'test-bucket',
  },
}));

vi.mock('@/lib/awsUtils', () => ({
  AwsUtils: {
    getS3ObjectBuffer: vi.fn(async () => ({ buffer: Buffer.from('%PDF-1.4 mock') })),
  },
}));

vi.mock('@/lib/aws', () => ({
  bedrockClient: {
    send: vi.fn(async () => ({
      output: {
        message: {
          content: [{ text: '{"questions":["1","1-1"]}' }],
        },
      },
    })),
  },
}));

vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  class ConverseCommand {
    constructor(_: any) {}
  }
  return { ConverseCommand };
});

import { analyzeExamPaper } from '@/services/BedrockService';

describe('BedrockService (unit)', () => {
  it('parses questions JSON from Bedrock response', async () => {
    const questions = await analyzeExamPaper('uploads/mock.pdf', 'math');
    expect(questions).toEqual(['1', '1-1']);
  });
});
