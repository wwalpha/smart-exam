import { createKanji } from './createKanji';
import { deleteKanji } from './deleteKanji';
import { getKanji } from './getKanji';
import { importKanji } from './importKanji';
import { listKanji } from './listKanji';
import { updateKanji } from './updateKanji';

export { createKanji, deleteKanji, getKanji, importKanji, listKanji, updateKanji };

export const KanjiRepository = {
  createKanji,
  getKanji,
  updateKanji,
  deleteKanji,
  importKanji,
  listKanji,
};
