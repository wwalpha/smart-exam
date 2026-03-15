import { bulkCreate } from './bulkCreate';
import { create } from './create';
import { remove } from './delete';
import { findByQuestionAnswer } from './findByQuestionAnswer';
import { get } from './get';
import { listKanji } from './listKanji';
import { update } from './update';

export { bulkCreate, create, remove, findByQuestionAnswer, get, listKanji, update };

export const KanjiRepository = {
  bulkCreate,
  create,
  findByQuestionAnswer,
  get,
  update,
  delete: remove,
  listKanji,
};
