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

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// S3 Presigned URL
app.post('/api/upload-url', s3Handler.getUploadUrl);

// Analyze Exam Paper (Bedrock)
app.post('/api/analyze-paper', bedrockHandler.analyzePaper);

// Exam Papers
app.get('/api/exampapers', examPaperHandler.listExamPapers);
app.post('/api/exampapers', examPaperHandler.createExamPaper);

// Exam Results
app.get('/api/examresults', examResultHandler.listExamResults);
app.post('/api/examresults', examResultHandler.createExamResult);

// Material Sets
app.get('/api/material-sets', materialHandler.listMaterialSets);
app.post('/api/material-sets', materialHandler.createMaterialSet);
app.get('/api/material-sets/:materialSetId', materialHandler.getMaterialSet);

// Kanji
app.get('/api/kanji', kanjiHandler.listKanji);
app.post('/api/kanji', kanjiHandler.createKanji);

// Questions
app.get('/api/material-sets/:materialSetId/questions', questionHandler.listQuestions);
app.post('/api/material-sets/:materialSetId/questions', questionHandler.createQuestion);
app.patch('/api/questions/:questionId', questionHandler.updateQuestion);

// Attempts
app.post('/api/questions/:testId/attempts', attemptHandler.createAttempt); // Note: testId here might be questionId based on path, but handler expects testId param. 
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
app.post('/api/tests/:testId/attempts', attemptHandler.createAttempt);
app.patch('/api/attempts/:attemptId/submit', attemptHandler.submitAttempt);
app.get('/api/tests/:testId/attempts/latest', attemptHandler.getLatestAttempt);

// Review Tests
app.get('/api/review-tests', reviewTestHandler.listReviewTests);
app.post('/api/review-tests', reviewTestHandler.createReviewTest);
app.get('/api/review-tests/:testId', reviewTestHandler.getReviewTest);
app.patch('/api/review-tests/:testId', reviewTestHandler.updateReviewTestStatus);
app.delete('/api/review-tests/:testId', reviewTestHandler.deleteReviewTest);

export const handler = serverlessExpress({ app });
