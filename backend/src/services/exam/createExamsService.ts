// Module: createExamsService responsibilities.

import type { Repositories } from '@/repositories/createRepositories';
import type { ExamsService } from './createExamsService.types';

import { createCreateExam } from './createExam';
import { createDeleteExam } from './deleteExam';
import { createGenerateExamPdfBuffer } from './generateExamPdfBuffer';
import { createGetExam } from './getExam';
import { createGetExamPdfUrl } from './getExamPdfUrl';
import { createListExamCandidates } from './listExamCandidates';
import { createListExamTargets } from './listExamTargets';
import { createListExams } from './listExams';
import { createSearchExams } from './searchExams';
import { createSubmitExamResults } from './submitExamResults';
import { createUpdateExamStatus } from './updateExamStatus';

export type { ExamsService } from './createExamsService.types';

/** Creates review tests service. */
export const createExamsService = (repositories: Repositories): ExamsService => {
  // 処理で使う値を準備する
  const listExams = createListExams(repositories);
  // 処理で使う値を準備する
  const searchExams = createSearchExams({ listExams });

  // 処理で使う値を準備する
  const deleteExam = createDeleteExam(repositories);
  // 処理で使う値を準備する
  const getExam = createGetExam(repositories);

  // 処理で使う値を準備する
  const createExam = createCreateExam({ repositories, getExam, deleteExam });

  // 処理で使う値を準備する
  const listExamTargets = createListExamTargets(repositories);
  // 処理で使う値を準備する
  const listExamCandidates = createListExamCandidates(repositories);
  // 処理で使う値を準備する
  const updateExamStatus = createUpdateExamStatus(repositories);
  // 処理で使う値を準備する
  const submitExamResults = createSubmitExamResults(repositories);

  // 処理で使う値を準備する
  const getExamPdfUrl = createGetExamPdfUrl({ repositories, getExam });
  // 処理で使う値を準備する
  const generateExamPdfBuffer = createGenerateExamPdfBuffer({ getExam });

  // 処理結果を呼び出し元へ返す
  return {
    listExams,
    searchExams,
    createExam,
    getExam,
    getExamPdfUrl,
    generateExamPdfBuffer,
    updateExamStatus,
    submitExamResults,
    deleteExam,
    listExamTargets,
    listExamCandidates,
  };
};
