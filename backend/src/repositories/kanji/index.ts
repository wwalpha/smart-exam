import { bulkCreate } from './bulkCreate';
import { create } from './create';
import { remove } from './delete';
import { get } from './get';
import { listKanji } from './listKanji';
import { update } from './update';
import { updateKanjiQuestionFields } from './updateKanjiQuestionFields';

export { bulkCreate, create, remove, get, listKanji, update, updateKanjiQuestionFields };

export const WordMasterRepository = {
  bulkCreate,
  create,
  get,
  update,
  updateKanjiQuestionFields,
  delete: remove,
  listKanji,
};
