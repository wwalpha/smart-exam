import { create } from './create';
import { remove } from './delete';
import { get } from './get';
import { listByMaterialId } from './listByMaterialId';
import { scanAll } from './scanAll';
import { update } from './update';

export { create, get, remove, scanAll, listByMaterialId, update };

export const QuestionsRepository = {
  create,
  get,
  delete: remove,
  scanAll,
  listByMaterialId,
  update,
};
