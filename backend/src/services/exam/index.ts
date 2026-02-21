import type {
  CreateExamRequest,
  ExamMode,
  Exam,
  ExamDetail,
  ExamTarget,
  SearchExamsRequest,
  SearchExamsResponse,
  SubjectId,
  SubmitExamResultsRequest,
  UpdateExamStatusRequest,
} from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { CreateExamDeps } from './createExam.types';
import { createKanjiExam } from './createExamKanji';
import { createCompleteExam } from './completeExam';
import { createQuestionExam } from './createExamQuestion';
import { createDeleteExam } from './deleteExam';
import { createGenerateExamPdfBuffer } from './generateExamPdfBuffer';
import { createGetExam } from './getExam';
import { createGetExamPdfUrl } from './getExamPdfUrl';
import { createListExamTargets } from './listExamTargets';
import { createListExams } from './listExams';
import { createSearchExams } from './searchExams';
import { createSubmitExamResults } from './submitExamResults';
import { createUpdateExamStatus } from './updateExamStatus';

export type ExamsService = {
  listExams: () => Promise<Exam[]>;
  searchExams: (params: SearchExamsRequest) => Promise<SearchExamsResponse>;
  createExam: (req: CreateExamRequest) => Promise<Exam>;
  getExam: (examId: string) => Promise<ExamDetail | null>;
  getExamPdfUrl: (examId: string, params?: { download?: boolean }) => Promise<{ url: string } | null>;
  generateExamPdfBuffer: (examId: string, options?: { includeGenerated?: boolean }) => Promise<Buffer | null>;
  updateExamStatus: (examId: string, req: UpdateExamStatusRequest) => Promise<Exam | null>;
  completeExam: (examId: string) => Promise<boolean>;
  submitExamResults: (examId: string, req: SubmitExamResultsRequest) => Promise<boolean>;
  deleteExam: (examId: string) => Promise<boolean>;
  listExamTargets: (params: {
    mode: ExamMode;
    fromYmd: string;
    toYmd: string;
    subject?: SubjectId;
  }) => Promise<ExamTarget[]>;
};

// 内部で利用する処理を定義する
const createExamDispatcher = async (deps: CreateExamDeps, req: CreateExamRequest): Promise<Exam> => {
  // 条件に応じて処理を分岐する
  if (req.mode === 'KANJI') {
    // 処理結果を呼び出し元へ返す
    return createKanjiExam(deps, req);
  }

  // 処理結果を呼び出し元へ返す
  return createQuestionExam(deps, req);
};

// 公開する処理を定義する
export const createCreateExam = (deps: CreateExamDeps): ExamsService['createExam'] => {
  // 処理結果を呼び出し元へ返す
  return async (req: CreateExamRequest): Promise<Exam> => {
    return createExamDispatcher(deps, req);
  };
};

// 公開する処理を定義する
export const createExamsService = (repositories: Repositories): ExamsService => {
  // 内部で利用する処理を定義する
  const listExams = createListExams(repositories);
  const searchExams = createSearchExams(repositories);

  // 内部で利用する処理を定義する
  const deleteExam = createDeleteExam(repositories);
  // 内部で利用する処理を定義する
  const getExam = createGetExam(repositories);

  // 内部で利用する処理を定義する
  const createExam = createCreateExam({ repositories, getExam, deleteExam });

  // 内部で利用する処理を定義する
  const listExamTargets = createListExamTargets(repositories);
  // 内部で利用する処理を定義する
  const updateExamStatus = createUpdateExamStatus(repositories);
  const completeExam = createCompleteExam(repositories);
  // 内部で利用する処理を定義する
  const submitExamResults = createSubmitExamResults(repositories);

  // 内部で利用する処理を定義する
  const getExamPdfUrl = createGetExamPdfUrl({ repositories, getExam });
  // 内部で利用する処理を定義する
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
    completeExam,
    submitExamResults,
    deleteExam,
    listExamTargets,
  };
};

// 公開する処理を定義する
export const examsService = createExamsService;
