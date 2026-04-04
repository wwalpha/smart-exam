import { describe, expect, it, vi } from 'vitest';

import type { Repositories } from '@/repositories/createRepositories';

describe('MaterialsService.listMaterialFiles', () => {
  it('returns files matched by material paths when metadata exists', async () => {
    process.env.FILES_BUCKET_NAME = 'dummy-bucket';
    vi.resetModules();
    const { createMaterialsService } = await import('@/services/materials');

    const repositories = {
      s3: {
        listObjectsByPrefix: vi.fn().mockResolvedValue([
          {
            key: 'materials/m1/QUESTION/11111111-1111-1111-1111-111111111111',
            lastModified: new Date('2026-04-01T00:00:00.000Z'),
          },
          {
            key: 'materials/m1/ANSWER/22222222-2222-2222-2222-222222222222',
            lastModified: new Date('2026-04-02T00:00:00.000Z'),
          },
        ]),
      },
      materials: {
        get: vi.fn().mockResolvedValue({
          materialId: 'm1',
          questionPdfPath: 'materials/m1/QUESTION/11111111-1111-1111-1111-111111111111',
          questionPdfFilename: 'question.pdf',
          answerPdfPath: 'materials/m1/ANSWER/22222222-2222-2222-2222-222222222222',
          answerPdfFilename: 'answer.pdf',
        }),
      },
    } as unknown as Repositories;

    const service = createMaterialsService(repositories);
    const files = await service.listMaterialFiles('m1');

    expect(files).toHaveLength(2);
    expect(files.map((file) => file.fileType)).toEqual(['QUESTION', 'ANSWER']);
    expect(files[0]?.filename).toBe('question.pdf');
    expect(files[1]?.filename).toBe('answer.pdf');
  });

  it('falls back to the latest file when material path metadata is missing', async () => {
    process.env.FILES_BUCKET_NAME = 'dummy-bucket';
    vi.resetModules();
    const { createMaterialsService } = await import('@/services/materials');

    const repositories = {
      s3: {
        listObjectsByPrefix: vi.fn().mockResolvedValue([
          {
            key: 'materials/m1/QUESTION/old-question.pdf',
            lastModified: new Date('2026-03-01T00:00:00.000Z'),
          },
          {
            key: 'materials/m1/QUESTION/new-question.pdf',
            lastModified: new Date('2026-04-01T00:00:00.000Z'),
          },
          {
            key: 'materials/m1/ANSWER/new-answer.pdf',
            lastModified: new Date('2026-04-02T00:00:00.000Z'),
          },
        ]),
      },
      materials: {
        get: vi.fn().mockResolvedValue({
          materialId: 'm1',
          questionPdfPath: '',
          answerPdfPath: '',
        }),
      },
    } as unknown as Repositories;

    const service = createMaterialsService(repositories);
    const files = await service.listMaterialFiles('m1');

    expect(files).toHaveLength(2);
    expect(files.find((file) => file.fileType === 'QUESTION')?.s3Key).toBe('materials/m1/QUESTION/new-question.pdf');
    expect(files.find((file) => file.fileType === 'ANSWER')?.s3Key).toBe('materials/m1/ANSWER/new-answer.pdf');
  });
});
