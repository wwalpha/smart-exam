// Module: createApp responsibilities.

import cors from 'cors';
import express from 'express';
import { z } from 'zod';

import { createControllers } from '@/controllers/createControllers';
import { handleRequest } from '@/lib/handler';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validateZod';
import { createRepositories } from '@/repositories/createRepositories';
import { createServices } from '@/services/createServices';


/** Creates app. */
export const createApp = (): express.Express => {
  const repositories = createRepositories();
  const services = createServices(repositories);
  const controllers = createControllers(services);

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
  app.post(
    '/api/upload-url',
    validateBody(controllers.s3.GetUploadUrlBodySchema),
    handleRequest(controllers.s3.getUploadUrl),
  );

  // Analyze Exam Paper (Bedrock)
  app.post(
    '/api/analyze-paper',
    validateBody(controllers.bedrock.AnalyzePaperBodySchema),
    handleRequest(controllers.bedrock.analyzePaper),
  );

  // Dashboard
  app.get('/api/dashboard', handleRequest(controllers.dashboard.getDashboard));

  // Materials
  app.get('/api/materials', handleRequest(controllers.materials.listMaterials));
  app.post(
    '/api/materials/search',
    validateBody(controllers.materials.SearchMaterialsBodySchema),
    handleRequest(controllers.materials.searchMaterials),
  );
  app.post(
    '/api/materials',
    validateBody(controllers.materials.CreateMaterialBodySchema),
    handleRequest(controllers.materials.createMaterial),
  );
  app.get(
    '/api/materials/:materialId',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.materials.getMaterial),
  );
  app.patch(
    '/api/materials/:materialId',
    validateParams(MaterialIdParamsSchema),
    validateBody(controllers.materials.UpdateMaterialBodySchema),
    handleRequest(controllers.materials.updateMaterial),
  );
  app.delete(
    '/api/materials/:materialId',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.materials.deleteMaterial),
  );
  app.get(
    '/api/materials/:materialId/files',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.materials.listMaterialFiles),
  );
  app.get(
    '/api/materials/:materialId/files/:fileId',
    validateParams(MaterialFileParamsSchema),
    handleRequest(controllers.materials.getMaterialFile),
  );

  // Kanji
  app.get('/api/kanji', handleRequest(controllers.kanji.listKanji));
  app.post(
    '/api/kanji/search',
    validateBody(controllers.kanji.SearchKanjiBodySchema),
    handleRequest(controllers.kanji.searchKanji),
  );
  app.post(
    '/api/kanji',
    validateBody(controllers.kanji.CreateKanjiBodySchema),
    handleRequest(controllers.kanji.createKanji),
  );
  app.get('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(controllers.kanji.getKanji));
  app.patch('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(controllers.kanji.updateKanji));
  app.delete('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(controllers.kanji.deleteKanji));
  app.post(
    '/api/kanji/deletions',
    validateBody(controllers.kanji.DeleteManyKanjiBodySchema),
    handleRequest(controllers.kanji.deleteManyKanji),
  );
  app.post(
    '/api/kanji/import',
    validateBody(controllers.kanji.ImportKanjiBodySchema),
    handleRequest(controllers.kanji.importKanji),
  );

  app.post(
    '/api/kanji/questions/:questionId/generate-reading',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.kanjiQuestions.generateReading),
  );

  app.patch(
    '/api/kanji/questions/:questionId',
    validateParams(QuestionIdParamsSchema),
    validateBody(controllers.kanjiQuestions.PatchKanjiQuestionBodySchema),
    handleRequest(controllers.kanjiQuestions.patch),
  );

  app.post(
    '/api/kanji/questions/:questionId/verify',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.kanjiQuestions.verify),
  );

  // Questions
  app.post(
    '/api/questions/search',
    validateBody(controllers.questions.SearchQuestionsBodySchema),
    handleRequest(controllers.questions.searchQuestions),
  );
  app.get(
    '/api/materials/:materialId/questions',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.questions.listQuestions),
  );
  app.post(
    '/api/materials/:materialId/questions',
    validateParams(MaterialIdParamsSchema),
    validateBody(controllers.questions.CreateQuestionBodySchema),
    handleRequest(controllers.questions.createQuestion),
  );
  app.patch(
    '/api/questions/:questionId',
    validateParams(QuestionIdParamsSchema),
    validateBody(controllers.questions.UpdateQuestionBodySchema),
    handleRequest(controllers.questions.updateQuestion),
  );
  app.put(
    '/api/questions/:questionId/review-candidate',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.questions.upsertQuestionReviewCandidate),
  );
  app.delete(
    '/api/questions/:questionId/review-candidate',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.questions.deleteQuestionReviewCandidate),
  );
  app.delete(
    '/api/questions/:questionId',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.questions.deleteQuestion),
  );

  // Review Tests
  app.get('/api/review-tests', handleRequest(controllers.reviewTests.listReviewTests));
  app.post(
    '/api/review-tests/search',
    validateBody(controllers.reviewTests.SearchReviewTestsBodySchema),
    handleRequest(controllers.reviewTests.searchReviewTests),
  );
  app.post(
    '/api/review-tests',
    validateBody(controllers.reviewTests.CreateReviewTestBodySchema),
    handleRequest(controllers.reviewTests.createReviewTest),
  );
  app.get(
    '/api/review-tests/targets',
    validateQuery(controllers.reviewTests.ListReviewTestTargetsQuerySchema),
    handleRequest(controllers.reviewTests.listReviewTestTargets),
  );
  app.get(
    '/api/review-test-candidates',
    validateQuery(controllers.reviewTestCandidates.ListReviewTestCandidatesQuerySchema),
    handleRequest(controllers.reviewTestCandidates.listReviewTestCandidates),
  );

  // Derived review attempts (read-only)
  app.get(
    '/api/review-attempts',
    validateQuery(controllers.reviewAttempts.ListReviewAttemptsQuerySchema),
    handleRequest(controllers.reviewAttempts.listReviewAttempts),
  );

  app.get(
    '/api/review-tests/:testId',
    validateParams(TestIdParamsSchema),
    handleRequest(controllers.reviewTests.getReviewTest),
  );
  app.get(
    '/api/review-tests/:testId/pdf',
    validateParams(TestIdParamsSchema),
    handleRequest(controllers.reviewTests.getReviewTestPdf),
  );
  app.patch(
    '/api/review-tests/:testId',
    validateParams(TestIdParamsSchema),
    validateBody(controllers.reviewTests.UpdateReviewTestStatusBodySchema),
    handleRequest(controllers.reviewTests.updateReviewTestStatus),
  );
  app.delete(
    '/api/review-tests/:testId',
    validateParams(TestIdParamsSchema),
    handleRequest(controllers.reviewTests.deleteReviewTest),
  );
  app.post(
    '/api/review-tests/:testId/results',
    validateParams(TestIdParamsSchema),
    validateBody(controllers.reviewTests.SubmitReviewTestResultsBodySchema),
    handleRequest(controllers.reviewTests.submitReviewTestResults),
  );

  return app;
};
