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
  const ExamIdParamsSchema = z.object({ examId: z.string().min(1) });

  const app = express();
  app.use(cors());
  app.use(express.json());

  // アプリケーションの稼働状態を確認するヘルスチェックAPI
  app.get(['/health', '/v1/health'], (_req, res) => {
    res.json({ status: 'ok' });
  });

  // S3へアップロードするための署名付きURLを発行するAPI
  app.post(
    '/api/upload-url',
    validateBody(controllers.s3.GetUploadUrlBodySchema),
    handleRequest(controllers.s3.getUploadUrl),
  );

  // 試験用紙を解析して構造化データを生成するAPI
  app.post(
    '/api/analyze-paper',
    validateBody(controllers.bedrock.AnalyzePaperBodySchema),
    handleRequest(controllers.bedrock.analyzePaper),
  );

  // ダッシュボード表示用の集計情報を取得するAPI
  app.get('/api/dashboard', handleRequest(controllers.dashboard.getDashboard));

  // 教材一覧を取得するAPI
  app.get('/api/materials', handleRequest(controllers.materials.listMaterials));
  // 条件を指定して教材を検索するAPI
  app.post(
    '/api/materials/search',
    validateBody(controllers.materials.SearchMaterialsBodySchema),
    handleRequest(controllers.materials.searchMaterials),
  );
  // 新しい教材を作成するAPI
  app.post(
    '/api/materials',
    validateBody(controllers.materials.CreateMaterialBodySchema),
    handleRequest(controllers.materials.createMaterial),
  );
  // 指定した教材の詳細を取得するAPI
  app.get(
    '/api/materials/:materialId',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.materials.getMaterial),
  );
  // 指定した教材の情報を更新するAPI
  app.patch(
    '/api/materials/:materialId',
    validateParams(MaterialIdParamsSchema),
    validateBody(controllers.materials.UpdateMaterialBodySchema),
    handleRequest(controllers.materials.updateMaterial),
  );
  // 指定した教材を削除するAPI
  app.delete(
    '/api/materials/:materialId',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.materials.deleteMaterial),
  );
  // 指定した教材に紐づくファイル一覧を取得するAPI
  app.get(
    '/api/materials/:materialId/files',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.materials.listMaterialFiles),
  );
  // 指定した教材ファイルの詳細を取得するAPI
  app.get(
    '/api/materials/:materialId/files/:fileId',
    validateParams(MaterialFileParamsSchema),
    handleRequest(controllers.materials.getMaterialFile),
  );

  // 条件を指定して漢字データを検索するAPI
  app.post(
    '/api/kanji/search',
    validateBody(controllers.kanji.SearchKanjiBodySchema),
    handleRequest(controllers.kanji.searchKanji),
  );
  // 漢字データを新規作成するAPI
  app.post(
    '/api/kanji',
    validateBody(controllers.kanji.RegistKanjiBodySchema),
    handleRequest(controllers.kanji.registKanji),
  );
  // 指定した漢字データの詳細を取得するAPI
  app.get('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(controllers.kanji.getKanji));
  // 指定した漢字データを更新するAPI
  app.patch(
    '/api/kanji/:kanjiId',
    validateParams(KanjiIdParamsSchema),
    validateBody(controllers.kanji.UpdateKanjiBodySchema),
    handleRequest(controllers.kanji.updateKanji),
  );
  // 指定した漢字データを削除するAPI
  app.delete('/api/kanji/:kanjiId', validateParams(KanjiIdParamsSchema), handleRequest(controllers.kanji.deleteKanji));
  // 複数の漢字データを一括削除するAPI
  app.post(
    '/api/kanji/deletions',
    validateBody(controllers.kanji.DeleteManyKanjiBodySchema),
    handleRequest(controllers.kanji.deleteManyKanji),
  );
  // 漢字データを一括インポートするAPI
  app.post(
    '/api/kanji/import',
    validateBody(controllers.kanji.ImportKanjiBodySchema),
    handleRequest(controllers.kanji.importKanji),
  );

  // 条件を指定して問題を検索するAPI
  app.post(
    '/api/questions/search',
    validateBody(controllers.questions.SearchQuestionsBodySchema),
    handleRequest(controllers.questions.searchQuestions),
  );
  // 指定した教材に紐づく問題一覧を取得するAPI
  app.get(
    '/api/materials/:materialId/questions',
    validateParams(MaterialIdParamsSchema),
    handleRequest(controllers.questions.listQuestions),
  );
  // 指定した教材に新しい問題を追加するAPI
  app.post(
    '/api/materials/:materialId/questions',
    validateParams(MaterialIdParamsSchema),
    validateBody(controllers.questions.CreateQuestionBodySchema),
    handleRequest(controllers.questions.createQuestion),
  );
  // 指定した問題を更新するAPI
  app.patch(
    '/api/questions/:questionId',
    validateParams(QuestionIdParamsSchema),
    validateBody(controllers.questions.UpdateQuestionBodySchema),
    handleRequest(controllers.questions.updateQuestion),
  );
  // 指定した問題の復習候補を作成または更新するAPI
  app.put(
    '/api/questions/:questionId/review-candidate',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.questions.upsertQuestionReviewCandidate),
  );
  // 指定した問題の復習候補を削除するAPI
  app.delete(
    '/api/questions/:questionId/review-candidate',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.questions.deleteQuestionReviewCandidate),
  );
  // 指定した問題を削除するAPI
  app.delete(
    '/api/questions/:questionId',
    validateParams(QuestionIdParamsSchema),
    handleRequest(controllers.questions.deleteQuestion),
  );

  // 条件を指定して漢字テストを検索するAPI
  app.post(
    '/api/exam/kanji/search',
    validateBody(controllers.exams.kanji.SearchTestsBodySchema),
    handleRequest(controllers.exams.kanji.searchTests),
  );
  // 漢字テストを新規作成するAPI
  app.post(
    '/api/exam/kanji',
    validateBody(controllers.exams.kanji.CreateTestBodySchema),
    handleRequest(controllers.exams.kanji.createTest),
  );
  // 漢字テスト作成対象の候補一覧を取得するAPI
  app.get(
    '/api/exam/kanji/targets',
    validateQuery(controllers.exams.kanji.ListTestTargetsQuerySchema),
    handleRequest(controllers.exams.kanji.listTestTargets),
  );

  // 条件を指定して問題テストを検索するAPI
  app.post(
    '/api/exam/question/search',
    validateBody(controllers.exams.question.SearchTestsBodySchema),
    handleRequest(controllers.exams.question.searchTests),
  );
  // 問題テストを新規作成するAPI
  app.post(
    '/api/exam/question',
    validateBody(controllers.exams.question.CreateTestBodySchema),
    handleRequest(controllers.exams.question.createTest),
  );
  // 問題テスト作成対象の候補一覧を取得するAPI
  app.get(
    '/api/exam/question/targets',
    validateQuery(controllers.exams.question.ListTestTargetsQuerySchema),
    handleRequest(controllers.exams.question.listTestTargets),
  );
  // 復習テスト候補の一覧を取得するAPI
  app.get(
    '/api/review-test-candidates',
    validateQuery(controllers.examCandidates.ListExamCandidatesQuerySchema),
    handleRequest(controllers.examCandidates.listExamCandidates),
  );

  // 復習テストの実施履歴を参照する読み取り専用API
  app.get(
    '/api/exam-attempts',
    validateQuery(controllers.examAttempts.ListExamAttemptsQuerySchema),
    handleRequest(controllers.examAttempts.listExamAttempts),
  );

  // 指定した漢字テストの詳細を取得するAPI
  app.get(
    '/api/exam/kanji/:examId',
    validateParams(ExamIdParamsSchema),
    handleRequest(controllers.exams.kanji.getTest),
  );
  // 指定した漢字テストのPDF情報を取得するAPI
  app.get(
    '/api/exam/kanji/:examId/pdf',
    validateParams(ExamIdParamsSchema),
    handleRequest(controllers.exams.kanji.getTestPdf),
  );
  // 指定した漢字テストのステータスを更新するAPI
  app.patch(
    '/api/exam/kanji/:examId',
    validateParams(ExamIdParamsSchema),
    validateBody(controllers.exams.kanji.UpdateExamStatusBodySchema),
    handleRequest(controllers.exams.kanji.updateTestStatus),
  );
  // 指定した漢字テストを削除するAPI
  app.delete(
    '/api/exam/kanji/:examId',
    validateParams(ExamIdParamsSchema),
    handleRequest(controllers.exams.kanji.deleteTest),
  );
  // 指定した漢字テストの結果を登録するAPI
  app.post(
    '/api/exam/kanji/:examId/results',
    validateParams(ExamIdParamsSchema),
    validateBody(controllers.exams.kanji.SubmitExamResultsBodySchema),
    handleRequest(controllers.exams.kanji.submitTestResults),
  );

  // 指定した問題テストの詳細を取得するAPI
  app.get(
    '/api/exam/question/:examId',
    validateParams(ExamIdParamsSchema),
    handleRequest(controllers.exams.question.getTest),
  );
  // 指定した問題テストのPDF情報を取得するAPI
  app.get(
    '/api/exam/question/:examId/pdf',
    validateParams(ExamIdParamsSchema),
    handleRequest(controllers.exams.question.getTestPdf),
  );
  // 指定した問題テストのステータスを更新するAPI
  app.patch(
    '/api/exam/question/:examId',
    validateParams(ExamIdParamsSchema),
    validateBody(controllers.exams.question.UpdateExamStatusBodySchema),
    handleRequest(controllers.exams.question.updateTestStatus),
  );
  // 指定した問題テストを削除するAPI
  app.delete(
    '/api/exam/question/:examId',
    validateParams(ExamIdParamsSchema),
    handleRequest(controllers.exams.question.deleteTest),
  );
  // 指定した問題テストの結果を登録するAPI
  app.post(
    '/api/exam/question/:examId/results',
    validateParams(ExamIdParamsSchema),
    validateBody(controllers.exams.question.SubmitExamResultsBodySchema),
    handleRequest(controllers.exams.question.submitTestResults),
  );

  return app;
};
