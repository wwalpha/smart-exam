import type {
  CreateWordTestRequest,
  CreateWordTestResponse,
  GradingData,
  GetWordTestDetailResponse,
  WordTestTitle,
  WordTestSubject,
  CreateWordGroupRequest,
  CreateWordGroupResponse,
  WordGroup,
  CreateExamPaperRequest,
  CreateExamResultRequest,
  ExamPaper,
  ExamResult,
  MaterialSet,
  MaterialSetListResponse,
  CreateMaterialSetRequest,
  UpdateMaterialSetRequest,
  MaterialFile,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ReviewTest,
  ReviewTestListResponse,
  CreateReviewTestRequest,
  ReviewTestDetail,
  UpdateReviewTestStatusRequest,
  SubmitReviewTestResultsRequest,
  Kanji,
  KanjiListResponse,
  CreateKanjiRequest,
  UpdateKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
  DashboardData,
} from '@smart-exam/api-types';

/**
 * API 呼び出しの状態（読込中/エラー）
 */
export type ApiStatus = {
  /** API 呼び出し中かどうか */
  isLoading: boolean;
  /** 失敗時のエラーメッセージ（成功時は null） */
  error: string | null;
};

/**
 * 単語テスト機能の Zustand state
 */
export type WordTestState = {
  /** 単語テスト一覧（サマリ） */
  lists: WordTestTitle[];
  /** 単語テスト詳細のキャッシュ（key=wordTestId） */
  details: Record<string, GetWordTestDetailResponse>;
  /** API 状態 */
  status: ApiStatus;
};

/**
 * 単語マスタ機能の Zustand state
 */
export type WordMasterState = {
  /** 単語グループ一覧 */
  groups: WordGroup[];
  /** API 状態 */
  status: ApiStatus;
};

/**
 * 試験管理機能の Zustand state
 */
export type ExamState = {
  papers: ExamPaper[];
  results: ExamResult[];
  status: ApiStatus;
};

/**
 * Material Slice State
 */
export type MaterialState = {
  list: MaterialSet[];
  total: number;
  detail: MaterialSet | null;
  files: MaterialFile[];
  questions: Question[];
  status: ApiStatus;
};

/**
 * Review Slice State
 */
export type ReviewState = {
  list: ReviewTest[];
  total: number;
  detail: ReviewTestDetail | null;
  status: ApiStatus;
};

/**
 * Kanji Slice State
 */
export type KanjiState = {
  list: Kanji[];
  total: number;
  detail: Kanji | null;
  status: ApiStatus;
};

/**
 * 単語テスト機能の Zustand slice（state + actions）
 */
export type WordTestSlice = {
  /** 単語テスト state */
  wordtest: WordTestState;
  /** 単語テスト一覧を取得する */
  fetchWordTests: () => Promise<void>;
  /** 単語テスト詳細を取得する */
  fetchWordTest: (wordTestId: string) => Promise<GetWordTestDetailResponse | null>;
  /** 単語テストを作成する */
  createWordTest: (request: CreateWordTestRequest) => Promise<CreateWordTestResponse>;
  /** 採点結果を反映する */
  applyWordTestGrading: (wordTestId: string, datas: GradingData[]) => Promise<void>;
};

/**
 * 単語マスタ機能の Zustand slice
 */
export type WordMasterSlice = {
  wordmaster: WordMasterState;
  fetchWordGroups: () => Promise<void>;
  createWordGroup: (request: CreateWordGroupRequest) => Promise<CreateWordGroupResponse>;
};

/**
 * 試験管理機能の Zustand slice
 */
export type ExamSlice = {
  exam: ExamState;
  fetchExamPapers: () => Promise<void>;
  createExamPaper: (request: CreateExamPaperRequest) => Promise<void>;
  createExamPaperWithUpload: (params: {
    grade: string;
    subject: string;
    category: string;
    name: string;
    questionFile: File;
    answerFile: File;
  }) => Promise<void>;
  fetchExamResults: () => Promise<void>;
  createExamResult: (request: CreateExamResultRequest) => Promise<void>;
  createExamResultWithUpload: (params: {
    grade: string;
    subject: string;
    category: string;
    name: string;
    title: string;
    test_date: string;
    gradedFile?: File;
    details: { number: number; is_correct: boolean }[];
  }) => Promise<void>;
};

/**
 * Material Slice
 */
export type MaterialSlice = {
  material: MaterialState;
  fetchMaterialSets: (params?: any) => Promise<void>;
  createMaterialSet: (request: CreateMaterialSetRequest) => Promise<MaterialSet>;
  fetchMaterialSet: (id: string) => Promise<void>;
  updateMaterialSet: (id: string, request: UpdateMaterialSetRequest) => Promise<void>;
  fetchMaterialFiles: (id: string) => Promise<void>;
  fetchQuestions: (id: string) => Promise<void>;
  createQuestion: (materialSetId: string, request: CreateQuestionRequest) => Promise<void>;
  updateQuestion: (questionId: string, request: UpdateQuestionRequest) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
};

/**
 * Review Slice
 */
export type ReviewSlice = {
  review: ReviewState;
  fetchReviewTests: (params?: any) => Promise<void>;
  createReviewTest: (request: CreateReviewTestRequest) => Promise<ReviewTest>;
  fetchReviewTest: (id: string) => Promise<void>;
  updateReviewTestStatus: (id: string, request: UpdateReviewTestStatusRequest) => Promise<void>;
  deleteReviewTest: (id: string) => Promise<void>;
  submitReviewTestResults: (id: string, request: SubmitReviewTestResultsRequest) => Promise<void>;
};

/**
 * Kanji Slice
 */
export type KanjiSlice = {
  kanji: KanjiState;
  fetchKanjiList: (params?: any) => Promise<void>;
  createKanji: (request: CreateKanjiRequest) => Promise<void>;
  fetchKanji: (id: string) => Promise<void>;
  updateKanji: (id: string, request: UpdateKanjiRequest) => Promise<void>;
  deleteKanji: (id: string) => Promise<void>;
  importKanji: (request: ImportKanjiRequest) => Promise<ImportKanjiResponse>;
};

/**
 * Dashboard Slice State
 */
export type DashboardState = {
  data: DashboardData | null;
  status: ApiStatus;
};

/**
 * Dashboard Slice
 */
export type DashboardSlice = {
  dashboard: DashboardState;
  fetchDashboardData: () => Promise<void>;
};
