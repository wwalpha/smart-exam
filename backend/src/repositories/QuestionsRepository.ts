import { dbHelper } from '../lib/aws';
import { ENV } from '../lib/env';
import { MaterialQuestionTable } from '../types/db';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;

export const QuestionsRepository = {
  create: async (item: MaterialQuestionTable): Promise<void> => {
    await dbHelper.put({
      TableName: TABLE_NAME,
      Item: item,
    });
  },

  get: async (questionId: string): Promise<MaterialQuestionTable | null> => {
    const result = await dbHelper.get<MaterialQuestionTable>({
      TableName: TABLE_NAME,
      Key: { questionId },
    });
    return result?.Item || null;
  },

  delete: async (questionId: string): Promise<void> => {
    await dbHelper.delete({
      TableName: TABLE_NAME,
      Key: { questionId },
    });
  },

  scanAll: async (): Promise<MaterialQuestionTable[]> => {
    const result = await dbHelper.scan<MaterialQuestionTable>({
      TableName: TABLE_NAME,
    });
    return result.Items || [];
  },

  listByMaterialId: async (materialId: string): Promise<MaterialQuestionTable[]> => {
    const result = await dbHelper.query<MaterialQuestionTable>({
      TableName: TABLE_NAME,
      IndexName: 'gsi_material_id_number',
      KeyConditionExpression: '#materialId = :materialId',
      ExpressionAttributeNames: { '#materialId': 'materialId' },
      ExpressionAttributeValues: { ':materialId': materialId },
    });
    return result.Items || [];
  },

  update: async (
    questionId: string,
    updates: Partial<MaterialQuestionTable>
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
        ReturnValues: 'ALL_NEW'
    });
    
    return (result.Attributes as MaterialQuestionTable) || null;
  },
};
