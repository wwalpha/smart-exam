import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { MaterialTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const MaterialsService = {
  create: async (item: MaterialTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  get: async (materialId: string): Promise<MaterialTable | null> => {
    const result = await dbHelper.get<MaterialTable>({
      TableName: TABLE_NAME,
      Key: { materialId },
    });
    return result?.Item || null;
  },

  delete: async (materialId: string): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { materialId },
    });
  },

  list: async (): Promise<MaterialTable[]> => {
    const result = await dbHelper.scan<MaterialTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  },
};
