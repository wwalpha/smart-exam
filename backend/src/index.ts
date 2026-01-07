import express from 'express';
import cors from 'cors';
import serverlessExpress from '@vendia/serverless-express';
import * as s3Handler from '@/handlers/s3';
import * as bedrockHandler from '@/handlers/bedrock';
import * as materialHandler from '@/handlers/materials';
import * as kanjiHandler from '@/handlers/kanji';
import * as questionHandler from '@/handlers/questions';
import * as reviewTestHandler from '@/handlers/reviewTests';
import * as reviewAttemptHandler from '@/handlers/reviewAttempts';
import * as dashboardHandler from '@/handlers/dashboard';
import { handleRequest } from '@/lib/handler';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validateZod';
import { z } from 'zod';

const MaterialIdParamsSchema = z.object({ materialId: z.string().min(1) });
const MaterialFileParamsSchema = z.object({ materialId: z.string().min(1), fileId: z.string().min(1) });
const KanjiIdParamsSchema = z.object({ kanjiId: z.string().min(1) });
const QuestionIdParamsSchema = z.object({ questionId: z.string().min(1) });
const TestIdParamsSchema = z.object({ testId: z.string().min(1) });

const app = express();
app.use(cors());
app.use(express.json());

app.get(['/health', '/v1/health'], (_req, res) => {
  res.json({ status: 'ok' });
});

// S3 Presigned URL
app.post('/api/upload-url', validateBody(s3Handler.GetUploadUrlBodySchema), handleRequest(s3Handler.getUploadUrl));

// Analyze Exam Paper (Bedrock)
app.post(
  '/api/analyze-paper',
  validateBody(bedrockHandler.AnalyzePaperBodySchema),
  handleRequest(bedrockHandler.analyzePaper)
);

// Dashboard
app.get('/api/dashboard', handleRequest(dashboardHandler.getDashboard));

// Materials
app.get('/api/materials', handleRequest(materialHandler.listMaterials));
app.post(
  '/api/materials/search',
  validateBody(materialHandler.SearchMaterialsBodySchema),
  handleRequest(materialHandler.searchMaterials)
);
app.post(
  '/api/materials',
  validateBody(materialHandler.CreateMaterialBodySchema),
  handleRequest(materialHandler.createMaterial)
);
app.get(
  '/api/materials/:materialId',
  validateParams(MaterialIdParamsSchema),
  handleRequest(materialHandler.getMaterial)
);
app.patch(
  '/api/materials/:materialId',
  validateParams(MaterialIdParamsSchema),
  validateBody(materialHandler.UpdateMaterialBodySchema),
  handleRequest(materialHandler.updateMaterial)
);
app.delete(
  '/api/materials/:materialId',
  validateParams(MaterialIdParamsSchema),
  handleRequest(materialHandler.deleteMaterial)
);
app.get(
  '/api/materials/:materialId/files',
  validateParams(MaterialIdParamsSchema),
  handleRequest(materialHandler.listMaterialFiles)
);
app.get(
  '/api/materials/:materialId/files/:fileId',
  validateParams(MaterialFileParamsSchema),
  handleRequest(materialHandler.getMaterialFile)
);

// Kanji
app.get('/api/kanji', handleRequest(kanjiHandler.listKanji));
app.post(
  '/api/kanji/search',
  validateBody(kanjiHandler.SearchKanjiBodySchema),
  handleRequest(kanjiHandler.searchKanji)
);
app.post('/api/kanji', validateBody(kanjiHandler.CreateKanjiBodySchema), handleRequest(kanjiHandler.createKanji));
app.get('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(kanjiHandler.getKanji));
app.patch('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(kanjiHandler.updateKanji));
app.delete('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(kanjiHandler.deleteKanji));
app.post(
  '/api/kanji/deletions',
  validateBody(kanjiHandler.DeleteManyKanjiBodySchema),
  handleRequest(kanjiHandler.deleteManyKanji)
);
app.post(
  '/api/kanji/import',
  validateBody(kanjiHandler.ImportKanjiBodySchema),
  handleRequest(kanjiHandler.importKanji)
);

// Questions
app.post(
  '/api/questions/search',
  validateBody(questionHandler.SearchQuestionsBodySchema),
  handleRequest(questionHandler.searchQuestions)
);
app.get(
  '/api/materials/:materialId/questions',
  validateParams(MaterialIdParamsSchema),
  handleRequest(questionHandler.listQuestions)
);
app.post(
  '/api/materials/:materialId/questions',
  validateParams(MaterialIdParamsSchema),
  validateBody(questionHandler.CreateQuestionBodySchema),
  handleRequest(questionHandler.createQuestion)
);
app.patch(
  '/api/questions/:questionId',
  validateParams(QuestionIdParamsSchema),
  validateBody(questionHandler.UpdateQuestionBodySchema),
  handleRequest(questionHandler.updateQuestion)
);
app.put(
  '/api/questions/:questionId/review-candidate',
  validateParams(QuestionIdParamsSchema),
  handleRequest(questionHandler.upsertQuestionReviewCandidate)
);
app.delete(
  '/api/questions/:questionId/review-candidate',
  validateParams(QuestionIdParamsSchema),
  handleRequest(questionHandler.deleteQuestionReviewCandidate)
);
app.delete(
  '/api/questions/:questionId',
  validateParams(QuestionIdParamsSchema),
  handleRequest(questionHandler.deleteQuestion)
);

// Review Tests
app.get('/api/review-tests', handleRequest(reviewTestHandler.listReviewTests));
app.post(
  '/api/review-tests/search',
  validateBody(reviewTestHandler.SearchReviewTestsBodySchema),
  handleRequest(reviewTestHandler.searchReviewTests)
);
app.post(
  '/api/review-tests',
  validateBody(reviewTestHandler.CreateReviewTestBodySchema),
  handleRequest(reviewTestHandler.createReviewTest)
);
app.get(
  '/api/review-tests/targets',
  validateQuery(reviewTestHandler.ListReviewTestTargetsQuerySchema),
  handleRequest(reviewTestHandler.listReviewTestTargets)
);
app.get(
  '/api/review-test-candidates',
  validateQuery(reviewTestHandler.ListReviewTestCandidatesQuerySchema),
  handleRequest(reviewTestHandler.listReviewTestCandidates)
);

// Derived review attempts (read-only)
app.get(
  '/api/review-attempts',
  validateQuery(reviewAttemptHandler.ListReviewAttemptsQuerySchema),
  handleRequest(reviewAttemptHandler.listReviewAttempts)
);

app.get(
  '/api/review-tests/:testId',
  validateParams(TestIdParamsSchema),
  handleRequest(reviewTestHandler.getReviewTest)
);
app.get(
  '/api/review-tests/:testId/pdf',
  validateParams(TestIdParamsSchema),
  handleRequest(reviewTestHandler.getReviewTestPdf)
);
app.patch(
  '/api/review-tests/:testId',
  validateParams(TestIdParamsSchema),
  validateBody(reviewTestHandler.UpdateReviewTestStatusBodySchema),
  handleRequest(reviewTestHandler.updateReviewTestStatus)
);
app.delete(
  '/api/review-tests/:testId',
  validateParams(TestIdParamsSchema),
  handleRequest(reviewTestHandler.deleteReviewTest)
);
app.post(
  '/api/review-tests/:testId/results',
  validateParams(TestIdParamsSchema),
  validateBody(reviewTestHandler.SubmitReviewTestResultsBodySchema),
  handleRequest(reviewTestHandler.submitReviewTestResults)
);

export const handler = serverlessExpress({
  app,
  binarySettings: {
    contentTypes: ['application/pdf'],
  },
});
