import type {
  CreateExamRequest,
  CreateExamResponse,
  ExamMode,
  ListExamTargetsResponse,
  SearchExamsRequest,
  SearchExamsResponse,
  SubjectId,
  UpdateExamStatusRequest,
  UpdateExamStatusResponse,
} from '@smart-exam/api-types';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';

import type { AsyncHandler } from '@/lib/handler';
import type { ValidatedBody, ValidatedQuery } from '@/types/express';
import type { Services } from '@/services/createServices';

import { CreateTestBodySchema, ListTestTargetsQuerySchema, SearchTestsBodySchema } from './modeScopedExam.schema';
import { UpdateExamStatusBodySchema } from './updateExamStatus.schema';

export const createModeScopedExamsController = (services: Services, mode: ExamMode) => {
  const ensureModeMatched = async (examId: string): Promise<boolean> => {
    const item = await services.exams.getExam(examId);
    if (!item) return false;
    return item.mode === mode;
  };

  const listTests: AsyncHandler<
    ParamsDictionary,
    { items: unknown[]; total: number },
    Record<string, never>,
    ParsedQs
  > = async (_req, res) => {
    const items = await services.exams.listExams();
    const filtered = items.filter((item) => item.mode === mode);
    res.json({ items: filtered, total: filtered.length });
  };

  const searchTests: AsyncHandler<ParamsDictionary, SearchExamsResponse, SearchExamsRequest, ParsedQs> = async (
    req,
    res,
  ) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof SearchTestsBodySchema>;

    const result = await services.exams.searchExams({
      ...body,
      mode,
    });

    res.json(result);
  };

  const createTest: AsyncHandler<ParamsDictionary, CreateExamResponse, CreateExamRequest, ParsedQs> = async (
    req,
    res,
  ) => {
    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof CreateTestBodySchema>;
    const item = await services.exams.createExam({
      ...body,
      mode,
    });
    res.status(201).json(item);
  };

  const listTestTargets: AsyncHandler<
    ParamsDictionary,
    ListExamTargetsResponse,
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const q = (req.validated?.query ?? req.query) as ValidatedQuery<typeof ListTestTargetsQuerySchema>;

    const items = await services.exams.listExamTargets({
      mode,
      fromYmd: q.from,
      toYmd: q.to,
      subject: q.subject as SubjectId | undefined,
    });

    res.json({ items });
  };

  const getTestPdf: AsyncHandler<
    { examId: string },
    { url: string } | { error: string },
    Record<string, never>,
    ParsedQs
  > = async (req, res) => {
    const { examId } = req.params;
    const matched = await ensureModeMatched(examId);
    if (!matched) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    const direct = String(req.query.direct ?? '') === '1' || String(req.query.direct ?? '') === 'true';
    const download = String(req.query.download ?? '') === '1' || String(req.query.download ?? '') === 'true';
    const includeGenerated =
      String(req.query.includeGenerated ?? '') === '1' || String(req.query.includeGenerated ?? '') === 'true';

    if (direct) {
      const pdf = await services.exams.generateExamPdfBuffer(examId, { includeGenerated });
      if (!pdf) {
        res.status(404).json({ error: 'Not Found' });
        return;
      }

      const filename = `test-${examId}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);
      res.status(200).end(pdf);
      return;
    }

    const result = await services.exams.getExamPdfUrl(examId, { download });
    if (!result) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(result);
  };

  const updateTestStatus: AsyncHandler<
    { examId: string },
    UpdateExamStatusResponse | { error: string },
    UpdateExamStatusRequest,
    ParsedQs
  > = async (req, res) => {
    const { examId } = req.params;
    const matched = await ensureModeMatched(examId);
    if (!matched) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    const body = (req.validated?.body ?? req.body) as ValidatedBody<typeof UpdateExamStatusBodySchema>;
    const item = await services.exams.updateExamStatus(examId, body);
    if (!item) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }
    res.json(item);
  };

  return {
    CreateTestBodySchema,
    SearchTestsBodySchema,
    ListTestTargetsQuerySchema,
    UpdateExamStatusBodySchema,
    listTests,
    searchTests,
    createTest,
    listTestTargets,
    getTestPdf,
    updateTestStatus,
  };
};
