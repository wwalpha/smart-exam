import { bulkCreate } from './bulkCreate';
import { create } from './create';
import { remove } from './delete';
import { bulkUpdateChoices } from './bulkUpdateChoices';
import { get } from './get';
import { listByMaterialId } from './listByMaterialId';
import { scanAll } from './scanAll';
import { update } from './update';

export { bulkCreate, create, get, remove, scanAll, listByMaterialId, update, bulkUpdateChoices };

export const MaterialQuestionsRepository = {
  bulkCreate,
  create,
  get,
  delete: remove,
  scanAll,
  listByMaterialId,
  update,
  bulkUpdateChoices,
};
