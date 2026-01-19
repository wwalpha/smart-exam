import { describe, expect, it, vi } from 'vitest';
import { listKanji, createKanji } from '@/controllers/kanji';
import { KanjiRepository } from '@/services';
import { Request, Response } from 'express';

// repository methods are spied per-test

describe('kanji handler', () => {
  it('listKanji returns items', async () => {
    const mockItems = [{ id: '1', kanji: '漢' }];
    vi.spyOn(KanjiRepository, 'listKanji').mockResolvedValue(mockItems as any);

    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await listKanji(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ items: mockItems, total: 1 });
  });

  it('createKanji creates item', async () => {
    const mockItem = { id: '1', kanji: '漢' };
    vi.spyOn(KanjiRepository, 'createKanji').mockResolvedValue(mockItem as any);

    const req = {
      body: { kanji: '漢', subject: '1' },
    } as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();

    await createKanji(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockItem);
  });
});
