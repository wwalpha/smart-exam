import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialTable } from '@/types/db';

import { get } from './get';

const TABLE_NAME = ENV.TABLE_MATERIALS;

export const update = async (materialId: string, updates: Partial<MaterialTable>): Promise<MaterialTable | null> => {
  const entries = Object.entries(updates).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return await get(materialId);

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
};
