import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import type { MaterialQuestionsTable } from '@/types/db';

import { get } from './get';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const update = async (
  questionId: string,
  updates: Partial<MaterialQuestionsTable>,
): Promise<MaterialQuestionsTable | null> => {
  const entries = Object.entries(updates).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    return get(questionId);
  }

  const expAttrNames: Record<string, string> = {};
  const expAttrValues: Record<string, unknown> = {};
  let updateExp = 'SET';

  entries.forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    expAttrNames[attrName] = key;
    expAttrValues[attrValue] = value;
    updateExp += ` ${attrName} = ${attrValue},`;
  });

  updateExp = updateExp.slice(0, -1);

  const result = await dbHelper.update({
    TableName: TABLE_NAME,
    Key: { questionId },
    UpdateExpression: updateExp,
    ExpressionAttributeNames: expAttrNames,
    ExpressionAttributeValues: expAttrValues,
    ReturnValues: 'ALL_NEW',
  });

  return (result.Attributes as MaterialQuestionsTable) ?? null;
};
