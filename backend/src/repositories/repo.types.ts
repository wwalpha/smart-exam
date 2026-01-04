import {
  MaterialSet,
  CreateMaterialSetRequest,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ReviewTest,
  CreateReviewTestRequest,
  Kanji,
  CreateKanjiRequest,
  Attempt,
  CreateAttemptRequest,
  SubmitAttemptRequest,
  ExamPaper,
  ExamResult,
} from '@smart-exam/api-types';

import { AttemptTable, AttemptResultItem } from '../types/db';

// Re-export types from api-types
export type {
  MaterialSet,
  CreateMaterialSetRequest,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ReviewTest,
  CreateReviewTestRequest,
  Kanji,
  CreateKanjiRequest,
  Attempt,
  CreateAttemptRequest,
  SubmitAttemptRequest,
  ExamPaper,
  ExamResult,
};

// Attempt Types (previously in attemptRepository.ts)
export type AttemptResult = AttemptResultItem;
// export type Attempt = AttemptTable; // Use api-types definition

// export type CreateAttemptRequest = {
//   subjectId: string;
// };

// export type SubmitAttemptRequest = {
//   results: AttemptResult[];
// };

// Exam Types (previously in types/exam.ts)
// ... removed local definitions
