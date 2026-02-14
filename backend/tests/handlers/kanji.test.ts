import { describe, expect, it, vi } from 'vitest';
import { kanjiController } from '@/controllers/kanji';
import type { Services } from '@/services';
import { Request, Response } from 'express';

// repository methods are spied per-test

describe('kanji handler', () => {
  it('listKanji returns items', async () => {
    const mockItems = [{ id: '1', kanji: '漢' }];

    const services = {
      kanji: {
        listKanji: vi.fn().mockResolvedValue(mockItems as unknown),
      },
    } as unknown as Services;

    const controller = kanjiController(services);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.listKanji(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createKanji creates item', async () => {
    const mockItem = { id: '1', kanji: '漢' };

    const services = {
      kanji: {
        createKanji: vi.fn().mockResolvedValue(mockItem as unknown),
      },
    } as unknown as Services;

    const controller = kanjiController(services);

    const req = {
      body: { kanji: '漢', subject: '1' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await controller.createKanji(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
