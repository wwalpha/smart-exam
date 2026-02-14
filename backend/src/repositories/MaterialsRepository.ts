// Module: MaterialsRepository responsibilities.

import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { MaterialTable } from '../types/db';


const TABLE_NAME = ENV.TABLE_MATERIALS;

/** MaterialsRepository. */
export const MaterialsRepository = {
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

  update: async (materialId: string, updates: Partial<MaterialTable>): Promise<MaterialTable | null> => {
    const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return await MaterialsRepository.get(materialId);

    const expAttrNames: Record<string, string> = { '#materialId': 'materialId' };
    const expAttrValues: Record<string, unknown> = { ':materialId': materialId };

    const sets: string[] = [];
    entries.forEach(([key, value], index) => {
      const nameKey = `#attr${index}`;
      const valueKey = `:val${index}`;
      expAttrNames[nameKey] = key;
      expAttrValues[valueKey] = value;
      sets.push(`${nameKey} = ${valueKey}`);
    });

    const result = await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { materialId },
      ConditionExpression: '#materialId = :materialId',
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: expAttrNames,
      ExpressionAttributeValues: expAttrValues,
      ReturnValues: 'ALL_NEW',
    });

    return (result.Attributes as MaterialTable) || null;
  },

  incrementQuestionCount: async (materialId: string, delta: number): Promise<void> => {
    if (!Number.isFinite(delta) || delta === 0) return;

    await dbHelper.update({
      TableName: TABLE_NAME,
      Key: { materialId },
      UpdateExpression: 'SET #questionCount = if_not_exists(#questionCount, :zero) + :delta',
      ExpressionAttributeNames: {
        '#questionCount': 'questionCount',
      },
      ExpressionAttributeValues: {
        ':zero': 0,
        ':delta': delta,
      },
    });
  },
};
