import { dbHelper } from '@/lib/aws';
import { ENV } from '@/lib/env';

const TABLE_NAME = ENV.TABLE_MATERIAL_QUESTIONS;
const MAX_TRANSACT_ITEMS = 25;

type BulkChoiceItem = {
  questionId: string;
  isCorrect: boolean;
  correctAnswer?: string;
};

const chunkItems = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

export const bulkUpdateChoices = async (items: BulkChoiceItem[]): Promise<void> => {
  if (items.length === 0) return;

  const chunks = chunkItems(items, MAX_TRANSACT_ITEMS);

  for (const chunk of chunks) {
    await dbHelper.transactWrite({
      TransactItems: chunk.map((item) => ({
        Update: {
          TableName: TABLE_NAME,
          Key: { questionId: item.questionId },
          UpdateExpression: 'SET #choice = :choice, #correctAnswer = :correctAnswer',
          ExpressionAttributeNames: {
            '#choice': 'choice',
            '#correctAnswer': 'correctAnswer',
          },
          ExpressionAttributeValues: {
            ':choice': item.isCorrect ? 'CORRECT' : 'INCORRECT',
            ':correctAnswer': item.isCorrect ? '' : String(item.correctAnswer ?? '').trim(),
          },
        },
      })),
    });
  }
};