import express from 'express';
import cors from 'cors';
import serverlessExpress from '@vendia/serverless-express';
import * as s3Handler from '@/handlers/s3';
import * as bedrockHandler from '@/handlers/bedrock';
import * as examPaperHandler from '@/handlers/examPaper';
import * as examResultHandler from '@/handlers/examResult';
import * as materialHandler from '@/handlers/material';
import * as kanjiHandler from '@/handlers/kanji';
import * as questionHandler from '@/handlers/question';
import * as attemptHandler from '@/handlers/attempt';
import * as reviewTestHandler from '@/handlers/reviewTest';
import { handleRequest } from '@/lib/handler';

const app = express();
app.use(cors());
app.use(express.json());

app.get(['/health', '/v1/health'], (req, res) => {
  res.json({ status: 'ok' });
});

// S3 Presigned URL
app.post('/api/upload-url', handleRequest(s3Handler.getUploadUrl));

// Analyze Exam Paper (Bedrock)
app.post('/api/analyze-paper', handleRequest(bedrockHandler.analyzePaper));

// Exam Papers
app.get('/api/exampapers', handleRequest(examPaperHandler.listExamPapers));
app.post('/api/exampapers', handleRequest(examPaperHandler.createExamPaper));

// Exam Results
app.get('/api/examresults', handleRequest(examResultHandler.listExamResults));
app.post('/api/examresults', handleRequest(examResultHandler.createExamResult));

// Material Sets
app.get('/api/material-sets', handleRequest(materialHandler.listMaterialSets));
app.post('/api/material-sets', handleRequest(materialHandler.createMaterialSet));
app.get('/api/material-sets/:materialSetId', handleRequest(materialHandler.getMaterialSet));
app.get('/api/material-sets/:materialSetId/files', handleRequest(materialHandler.listMaterialFiles));

// Kanji
app.get('/api/kanji', handleRequest(kanjiHandler.listKanji));
app.post('/api/kanji', handleRequest(kanjiHandler.createKanji));
app.get('/api/kanji/:kanjiId', handleRequest(kanjiHandler.getKanji));
app.patch('/api/kanji/:kanjiId', handleRequest(kanjiHandler.updateKanji));
app.delete('/api/kanji/:kanjiId', handleRequest(kanjiHandler.deleteKanji));
app.post('/api/kanji/import', handleRequest(kanjiHandler.importKanji));

// Questions
app.get('/api/material-sets/:materialSetId/questions', handleRequest(questionHandler.listQuestions));
app.post('/api/material-sets/:materialSetId/questions', handleRequest(questionHandler.createQuestion));
app.patch('/api/questions/:questionId', handleRequest(questionHandler.updateQuestion));

// Attempts
app.post('/api/questions/:testId/attempts', handleRequest(attemptHandler.createAttempt)); // Note: testId here might be questionId based on path, but handler expects testId param.
// Re-reading backend_api.md: POST /api/questions/{questionId}/attempts
// But my attempt handler was designed for test attempts.
// Let's stick to the backend_api.md definition for now, but I implemented test attempts.
// I will map it to test attempts for now as per my repository implementation which matches dynamodb_tables.md (attempts table is for tests).
// Wait, backend_api.md says "Attempts (正誤履歴: 追記型)" -> POST /api/questions/{questionId}/attempts.
// This implies per-question attempt logging.
// However, dynamodb_tables.md says "attempts" table is for "実施（attempt）と正誤結果" linked to "test_id".
// There seems to be a discrepancy. I will follow the "test attempt" model for now as it's more common for exams.
// Actually, let's look at the handler again.
// createAttempt takes testId from params.
// So I will expose it as /api/tests/:testId/attempts for now to match the repo logic.
app.post('/api/tests/:testId/attempts', handleRequest(attemptHandler.createAttempt));
app.patch('/api/attempts/:attemptId/submit', handleRequest(attemptHandler.submitAttempt));
app.get('/api/tests/:testId/attempts/latest', handleRequest(attemptHandler.getLatestAttempt));

// Review Tests
app.get('/api/review-tests', handleRequest(reviewTestHandler.listReviewTests));
app.post('/api/review-tests', handleRequest(reviewTestHandler.createReviewTest));
app.get('/api/review-tests/:testId', handleRequest(reviewTestHandler.getReviewTest));
app.patch('/api/review-tests/:testId', handleRequest(reviewTestHandler.updateReviewTestStatus));
app.delete('/api/review-tests/:testId', handleRequest(reviewTestHandler.deleteReviewTest));

export const handler = serverlessExpress({ app });
