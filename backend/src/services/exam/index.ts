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

// 作成リクエストの mode に応じて問題系/漢字系の作成処理を切り替える。
const createExamDispatcher = async (deps: CreateExamDeps, req: CreateExamRequest): Promise<Exam> => {
  if (req.mode === 'KANJI') {
    return createKanjiExam(deps, req);
  }
  return createQuestionExam(deps, req);
};

// 依存関係を閉じ込めた createExam ハンドラを生成する。
export const createCreateExam = (deps: CreateExamDeps): ExamsService['createExam'] => {
  return async (req: CreateExamRequest): Promise<Exam> => {
    return createExamDispatcher(deps, req);
  };
};

// 各 use-case の関数を束ねて exam サービスを構築する。
export const createExamsService = (repositories: Repositories): ExamsService => {
  const listExams = createListExams(repositories);
  const searchExams = createSearchExams(repositories);
  const deleteExam = createDeleteExam(repositories);
  const getExam = createGetExam(repositories);
  const createExam = createCreateExam({ repositories, getExam, deleteExam });
  const listExamTargets = createListExamTargets(repositories);
  const updateExamStatus = createUpdateExamStatus(repositories);
  const completeExam = createCompleteExam(repositories);
  const submitExamResults = createSubmitExamResults(repositories);
  const getExamPdfUrl = createGetExamPdfUrl({ repositories, getExam });
  const generateExamPdfBuffer = createGenerateExamPdfBuffer({ getExam });
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

// 既存呼び出しとの互換のためエイリアスを残す。
export const examsService = createExamsService;
