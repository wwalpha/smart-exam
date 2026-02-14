import type {
  CreateWordTestRequest,
  CreateWordTestResponse,
  GradingData,
  GetWordTestDetailResponse,
  WordTestTitle,
  CreateWordGroupRequest,
  CreateWordGroupResponse,
  WordGroup,
  Material,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  MaterialFile,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ReviewTest,
  CreateReviewTestRequest,
  ReviewTestDetail,
  UpdateReviewTestStatusRequest,
  SubmitReviewTestResultsRequest,
  ReviewTestTarget,
  ReviewAttempt,
  ReviewTestCandidate,
  Kanji,
  CreateKanjiRequest,
  UpdateKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
  DashboardData,
  SearchReviewTestsRequest,
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
 * Material Slice State
 */
export type MaterialState = {
  list: Material[];
  total: number;
  detail: Material | null;
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

export type ReviewTargetState = {
  items: ReviewTestTarget[];
  status: ApiStatus;
};

export type ReviewAttemptHistoryState = {
  items: ReviewAttempt[];
  status: ApiStatus;
};

export type ReviewCandidateState = {
  items: ReviewTestCandidate[];
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
 * 復習テスト機能（+ 単語テスト機能）をまとめた Zustand slice
 */
export type ReviewTestSlice = {
  /** 単語テスト state */
  wordtest: WordTestState;
  fetchWordTests: () => Promise<void>;
  fetchWordTest: (wordTestId: string) => Promise<GetWordTestDetailResponse | null>;
  createWordTest: (request: CreateWordTestRequest) => Promise<CreateWordTestResponse>;
  applyWordTestGrading: (wordTestId: string, datas: GradingData[]) => Promise<void>;

  /** 復習テスト state */
  review: ReviewState;
  reviewTargets: ReviewTargetState;
  reviewAttempts: ReviewAttemptHistoryState;
  reviewCandidates: ReviewCandidateState;
  fetchReviewTests: (params: SearchReviewTestsRequest) => Promise<void>;
  createReviewTest: (request: CreateReviewTestRequest) => Promise<ReviewTest>;
  fetchReviewTest: (id: string, mode: 'QUESTION' | 'KANJI') => Promise<void>;
  updateReviewTestStatus: (id: string, request: UpdateReviewTestStatusRequest, mode: 'QUESTION' | 'KANJI') => Promise<void>;
  deleteReviewTest: (id: string, mode: 'QUESTION' | 'KANJI') => Promise<void>;
  submitReviewTestResults: (id: string, request: SubmitReviewTestResultsRequest, mode: 'QUESTION' | 'KANJI') => Promise<void>;
  fetchReviewTestTargets: (params: {
    mode: 'QUESTION' | 'KANJI';
    from: string;
    to: string;
    subject?: string;
  }) => Promise<void>;
  fetchReviewAttempts: (params: { targetType: 'QUESTION' | 'KANJI'; targetId: string; subject?: string }) => Promise<void>;
  fetchReviewTestCandidates: (params?: { subject?: string; mode?: 'QUESTION' | 'KANJI' }) => Promise<void>;
};

/**
 * Material Slice
 */
export type MaterialSlice = {
  material: MaterialState;
  fetchMaterials: (params?: Record<string, unknown>) => Promise<void>;
  createMaterial: (request: CreateMaterialRequest) => Promise<Material>;
  createMaterialWithUpload: (params: {
    request: CreateMaterialRequest;
    questionFile?: File;
    answerFile?: File;
    gradedFile?: File;
  }) => Promise<Material>;
  uploadMaterialPdf: (params: {
    materialId: string;
    fileType: 'QUESTION' | 'ANSWER' | 'GRADED_ANSWER';
    file: File;
  }) => Promise<void>;
  fetchMaterial: (id: string) => Promise<void>;
  updateMaterial: (id: string, request: UpdateMaterialRequest) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  fetchMaterialFiles: (id: string) => Promise<void>;
  fetchQuestions: (id: string) => Promise<void>;
  extractQuestionsFromGradedAnswer: (materialId: string) => Promise<void>;
  createQuestion: (materialId: string, request: CreateQuestionRequest) => Promise<void>;
  createQuestionsBulk: (materialId: string, requests: CreateQuestionRequest[]) => Promise<void>;
  updateQuestion: (questionId: string, request: UpdateQuestionRequest) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  markQuestionCorrect: (questionId: string) => Promise<void>;
  markQuestionIncorrect: (questionId: string) => Promise<void>;
};

/**
 * Review Slice
 */
export type KanjiSlice = {
  kanji: KanjiState;
  fetchKanjiList: (params?: Record<string, unknown>) => Promise<void>;
  createKanji: (request: CreateKanjiRequest) => Promise<void>;
  fetchKanji: (id: string) => Promise<void>;
  updateKanji: (id: string, request: UpdateKanjiRequest) => Promise<void>;
  deleteKanji: (id: string) => Promise<void>;
  deleteManyKanji: (ids: string[]) => Promise<void>;
  importKanji: (request: ImportKanjiRequest) => Promise<ImportKanjiResponse>;

  /** 単語グループ（wordmaster）も漢字系として統合 */
  wordmaster: WordMasterState;
  fetchWordGroups: () => Promise<void>;
  createWordGroup: (request: CreateWordGroupRequest) => Promise<CreateWordGroupResponse>;
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
