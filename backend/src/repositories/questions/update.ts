import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';
import { MaterialQuestionTable } from '@/types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const update = async (
  questionId: string,
  updates: Partial<MaterialQuestionTable>,
): Promise<MaterialQuestionTable | null> => {
  const expAttrNames: Record<string, string> = {};
  const expAttrValues: Record<string, unknown> = {};
  let updateExp = 'SET';

  Object.entries(updates).forEach(([key, value], index) => {
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

  return (result.Attributes as MaterialQuestionTable) || null;
};
