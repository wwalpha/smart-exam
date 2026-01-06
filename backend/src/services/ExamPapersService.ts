import { MaterialsService } from './MaterialsService';
import type { MaterialTable } from '../types/db';

export const ExamPapersService = {
  create: async (item: MaterialTable): Promise<void> => {
    await MaterialsService.create(item);
  },

  list: async (): Promise<MaterialTable[]> => {
    return MaterialsService.list();
  },
};
