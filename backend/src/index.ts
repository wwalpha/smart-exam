import express from 'express';
import cors from 'cors';
import serverlessExpress from '@vendia/serverless-express';
import * as s3Handler from '@/handlers/s3';
import * as bedrockHandler from '@/handlers/bedrock';
import * as materialHandler from '@/handlers/material';
import * as kanjiHandler from '@/handlers/kanji';
import * as questionHandler from '@/handlers/question';
import * as reviewTestHandler from '@/handlers/reviewTest';
import * as reviewAttemptHandler from '@/handlers/reviewAttempt';
import * as dashboardHandler from '@/handlers/dashboard';
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

// Dashboard
app.get('/api/dashboard', handleRequest(dashboardHandler.getDashboard));

// Materials
app.get('/api/materials', handleRequest(materialHandler.listMaterials));
app.post('/api/materials/search', handleRequest(materialHandler.searchMaterials));
app.post('/api/materials', handleRequest(materialHandler.createMaterial));
app.get('/api/materials/:materialId', handleRequest(materialHandler.getMaterial));
app.patch('/api/materials/:materialId', handleRequest(materialHandler.updateMaterial));
app.delete('/api/materials/:materialId', handleRequest(materialHandler.deleteMaterial));
app.get('/api/materials/:materialId/files', handleRequest(materialHandler.listMaterialFiles));
app.get('/api/materials/:materialId/files/:fileId', handleRequest(materialHandler.getMaterialFile));

// Kanji
app.get('/api/kanji', handleRequest(kanjiHandler.listKanji));
app.post('/api/kanji/search', handleRequest(kanjiHandler.searchKanji));
app.post('/api/kanji', handleRequest(kanjiHandler.createKanji));
app.get('/api/kanji/:kanjiId', handleRequest(kanjiHandler.getKanji));
app.patch('/api/kanji/:kanjiId', handleRequest(kanjiHandler.updateKanji));
app.delete('/api/kanji/:kanjiId', handleRequest(kanjiHandler.deleteKanji));
app.post('/api/kanji/import', handleRequest(kanjiHandler.importKanji));

// Questions
app.post('/api/questions/search', handleRequest(questionHandler.searchQuestions));
app.get('/api/materials/:materialId/questions', handleRequest(questionHandler.listQuestions));
app.post('/api/materials/:materialId/questions', handleRequest(questionHandler.createQuestion));
app.patch('/api/questions/:questionId', handleRequest(questionHandler.updateQuestion));
app.delete('/api/questions/:questionId', handleRequest(questionHandler.deleteQuestion));

// Review Tests
app.get('/api/review-tests', handleRequest(reviewTestHandler.listReviewTests));
app.post('/api/review-tests/search', handleRequest(reviewTestHandler.searchReviewTests));
app.post('/api/review-tests', handleRequest(reviewTestHandler.createReviewTest));
app.get('/api/review-tests/targets', handleRequest(reviewTestHandler.listReviewTestTargets));
app.get('/api/review-test-candidates', handleRequest(reviewTestHandler.listReviewTestCandidates));

// Derived review attempts (read-only)
app.get('/api/review-attempts', handleRequest(reviewAttemptHandler.listReviewAttempts));

app.get('/api/review-tests/:testId', handleRequest(reviewTestHandler.getReviewTest));
app.get('/api/review-tests/:testId/pdf', handleRequest(reviewTestHandler.getReviewTestPdf));
app.patch('/api/review-tests/:testId', handleRequest(reviewTestHandler.updateReviewTestStatus));
app.delete('/api/review-tests/:testId', handleRequest(reviewTestHandler.deleteReviewTest));
app.post('/api/review-tests/:testId/results', handleRequest(reviewTestHandler.submitReviewTestResults));

export const handler = serverlessExpress({
  app,
  binarySettings: {
    contentTypes: ['application/pdf'],
  },
});
