import { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createDynamoDbDocumentClient } from './dynamodb';
import { ExamPaper, ExamResult } from '../types/exam';
import { randomUUID } from 'crypto';

const ddbDocClient = createDynamoDbDocumentClient();

const EXAM_PAPERS_TABLE = process.env.EXAM_PAPERS_TABLE || '';
const EXAM_RESULTS_TABLE = process.env.EXAM_RESULTS_TABLE || '';

export const createExamPaper = async (paper: Omit<ExamPaper, 'paper_id' | 'created_at'>): Promise<ExamPaper> => {
  const newPaper: ExamPaper = {
    ...paper,
    paper_id: randomUUID(),
    created_at: new Date().toISOString(),
  };

  await ddbDocClient.send(
    new PutCommand({
      TableName: EXAM_PAPERS_TABLE,
      Item: newPaper,
    })
  );

  return newPaper;
};

export const listExamPapers = async (): Promise<ExamPaper[]> => {
  const result = await ddbDocClient.send(
    new ScanCommand({
      TableName: EXAM_PAPERS_TABLE,
    })
  );
  return (result.Items as ExamPaper[]) || [];
};

export const createExamResult = async (result: Omit<ExamResult, 'result_id' | 'created_at'>): Promise<ExamResult> => {
  const newResult: ExamResult = {
    ...result,
    result_id: randomUUID(),
    created_at: new Date().toISOString(),
  };

  await ddbDocClient.send(
    new PutCommand({
      TableName: EXAM_RESULTS_TABLE,
      Item: newResult,
    })
  );

  return newResult;
};

export const listExamResults = async (): Promise<ExamResult[]> => {
  const result = await ddbDocClient.send(
    new ScanCommand({
      TableName: EXAM_RESULTS_TABLE,
    })
  );
  return (result.Items as ExamResult[]) || [];
};
