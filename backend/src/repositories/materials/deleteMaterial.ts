import { MaterialsService } from '@/services/MaterialsService';

export const deleteMaterial = async (id: string): Promise<boolean> => {
  const existing = await MaterialsService.get(id);
  if (!existing) return false;
  await MaterialsService.delete(id);
  return true;
};
