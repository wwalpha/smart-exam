import { create } from './create';
import { remove } from './delete';
import { get } from './get';
import { incrementQuestionCount } from './incrementCount';
import { list } from './list';
import { update } from './update';

export { create, get, update, remove, list, incrementQuestionCount };

export const MaterialsRepository = {
  create,
  get,
  update,
  delete: remove,
  list,
  incrementQuestionCount,
};
