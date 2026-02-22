import type { Services } from '@/services/createServices';

import { createExamController } from './createExam';
import { completeExam } from './completeExam';
import { CompleteExamParamsSchema } from './completeExam.schema';
import { deleteExam } from './deleteExam';
import { DeleteExamParamsSchema } from './deleteExam.schema';
import { getExam } from './getExam';
import { getExamPdfController } from './getExamPdf';
import { GetExamParamsSchema } from './getExam.schema';
import { kanjiTestsController } from './kanjiTestsController';
import { listExamTargetsController } from './listExamTargets';
import { materialsTestsController } from './materialsTestsController';
import { searchExamsController } from './searchExams';
import { submitExamResults } from './submitExamResults';
import { SubmitExamResultsBodySchema, SubmitExamResultsParamsSchema } from './submitExamResults.schema';
import { updateExamStatus } from './updateExamStatus';
import { UpdateExamStatusBodySchema, UpdateExamStatusParamsSchema } from './updateExamStatus.schema';

export const examsController = (services: Services) => {
  const searchExams = searchExamsController(services);
  const createExam = createExamController(services);
  const listExamTargets = listExamTargetsController(services);
  const getExamPdf = getExamPdfController(services);

  return {
    kanji: kanjiTestsController(services),
    materials: materialsTestsController(services),
    SearchExamsBodySchema: searchExams.SearchExamsBodySchema,
    searchExams: searchExams.searchExams,
    CreateExamBodySchema: createExam.CreateExamBodySchema,
    createExam: createExam.createExam,
    ListExamTargetsQuerySchema: listExamTargets.ListExamTargetsQuerySchema,
    listExamTargets: listExamTargets.listExamTargets,
    GetExamPdfParamsSchema: getExamPdf.GetExamPdfParamsSchema,
    GetExamPdfQuerySchema: getExamPdf.GetExamPdfQuerySchema,
    getExamPdf: getExamPdf.getExamPdf,
    GetExamParamsSchema,
    getExam: getExam(services),
    CompleteExamParamsSchema,
    completeExam: completeExam(services),
    SubmitExamResultsParamsSchema,
    SubmitExamResultsBodySchema,
    submitResults: submitExamResults(services),
    UpdateExamStatusParamsSchema,
    UpdateExamStatusBodySchema,
    updateExamStatus: updateExamStatus(services),
    DeleteExamParamsSchema,
    deleteExam: deleteExam(services),
  };
};
