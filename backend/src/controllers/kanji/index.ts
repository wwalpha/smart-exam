import { z } from 'zod';

import { SubjectIdSchema } from '@/lib/zodSchemas';
import type { Services } from '@/services/createServices';

import { deleteKanji } from './deleteKanji';
import { deleteManyKanji } from './deleteManyKanji';
import { getKanji } from './getKanji';
import { importKanji } from './importKanji';
import { registKanji } from './registKanji';
import { searchKanji } from './searchKanji';
import { updateKanji } from './updateKanji';

export const RegistKanjiBodySchema = z.object({
  kanji: z.string().trim().min(1),
  reading: z.string().trim().min(1),
  subject: SubjectIdSchema,
});

export const SearchKanjiBodySchema = z.object({
  q: z.string().optional(),
  reading: z.string().optional(),
  subject: SubjectIdSchema.optional(),
  limit: z.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export const UpdateKanjiBodySchema = z.object({
  kanji: z.string().trim().min(1).optional(),
  reading: z.string().trim().min(1).optional(),
  subject: SubjectIdSchema.optional(),
});

export const ImportKanjiBodySchema = z.object({
  fileContent: z.string().min(1),
  subject: SubjectIdSchema,
});

export const DeleteManyKanjiBodySchema = z.object({
  kanjiIds: z.array(z.string().min(1)).min(1),
});

export const kanjiController = (services: Services) => {
  return {
    RegistKanjiBodySchema,
    SearchKanjiBodySchema,
    UpdateKanjiBodySchema,
    ImportKanjiBodySchema,
    DeleteManyKanjiBodySchema,
    searchKanji: searchKanji(services),
    registKanji: registKanji(services),
    getKanji: getKanji(services),
    updateKanji: updateKanji(services),
    deleteKanji: deleteKanji(services),
    deleteManyKanji: deleteManyKanji(services),
    importKanji: importKanji(services),
  };
};
