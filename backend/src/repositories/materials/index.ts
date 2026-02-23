import { create } from './create';
import { remove } from './delete';
import { get } from './get';
import { incrementQuestionCount } from './incrementCount';
import { list } from './list';
import { listWithOpenCandidates } from './listWithOpenCandidates';
import { search } from './search';
import { update } from './update';

export { create, get, update, remove, list, listWithOpenCandidates, search, incrementQuestionCount };

export const MaterialsRepository = {
  create,
  get,
  update,
  delete: remove,
  list,
  listWithOpenCandidates,
  search,
  incrementQuestionCount,
};
