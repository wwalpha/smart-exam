import type { KanjiService } from './createKanjiService.types';

export type UpdateKanjiData = Parameters<KanjiService['updateKanji']>[1];
