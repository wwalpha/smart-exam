import { bulkCreate } from './bulkCreate';
import { create } from './create';
import { remove } from './delete';
import { get } from './get';
import { listKanji } from './listKanji';
import { update } from './update';

export { bulkCreate, create, remove, get, listKanji, update };

export const KanjiRepository = {
  bulkCreate,
  create,
  get,
  update,
  delete: remove,
  listKanji,
};
