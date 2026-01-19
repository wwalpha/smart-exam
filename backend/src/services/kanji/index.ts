import { createKanji } from './createKanji';
import { deleteKanji } from './deleteKanji';
import { deleteManyKanji } from './deleteManyKanji';
import { getKanji } from './getKanji';
import { importKanji } from './importKanji';
import { listKanji } from './listKanji';
import { updateKanji } from './updateKanji';

export { createKanji, deleteKanji, deleteManyKanji, getKanji, importKanji, listKanji, updateKanji };

export const KanjiRepository = {
  createKanji,
  getKanji,
  updateKanji,
  deleteKanji,
  deleteManyKanji,
  importKanji,
  listKanji,
};
