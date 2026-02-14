// Module: kanjiController responsibilities.

import type { Services } from '@/services/createServices';

import {
  CreateKanjiBodySchema,
  DeleteManyKanjiBodySchema,
  ImportKanjiBodySchema,
  SearchKanjiBodySchema,
} from './kanjiController.schema';

import { createKanjiController } from './createKanjiController';
import { deleteKanjiController } from './deleteKanjiController';
import { deleteManyKanjiController } from './deleteManyKanjiController';
import { getKanjiController } from './getKanjiController';
import { importKanjiController } from './importKanjiController';
import { listKanjiController } from './listKanjiController';
import { searchKanjiController } from './searchKanjiController';
import { updateKanjiController } from './updateKanjiController';

/** Creates kanji controller. */
export const kanjiController = (services: Services) => {
  const listKanji = listKanjiController(services);
  const searchKanji = searchKanjiController(services);
  const createKanji = createKanjiController(services);
  const getKanji = getKanjiController(services);
  const updateKanji = updateKanjiController(services);
  const deleteKanji = deleteKanjiController(services);
  const deleteManyKanji = deleteManyKanjiController(services);
  const importKanji = importKanjiController(services);

  return {
    CreateKanjiBodySchema,
    SearchKanjiBodySchema,
    ImportKanjiBodySchema,
    DeleteManyKanjiBodySchema,
    listKanji,
    searchKanji,
    createKanji,
    getKanji,
    updateKanji,
    deleteKanji,
    deleteManyKanji,
    importKanji,
  };
};
