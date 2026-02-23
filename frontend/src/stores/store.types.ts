import type {
  CreateWordTestRequest,
  CreateWordTestResponse,
  GradingData,
  GetWordTestDetailResponse,
  WordTestTitle,
  CreateKanjiGroupRequest,
  CreateKanjiGroupResponse,
  KanjiGroup,
  Material,
  CreateMaterialRequest,
  CreateMaterialResponse,
  UpdateMaterialRequest,
  MaterialFile,
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  Exam,
  CreateExamRequest,
  ExamDetail,
  UpdateExamStatusRequest,
  SubmitExamResultsRequest,
  ExamTarget,
  Kanji,
  RegistKanjiRequest,
  UpdateKanjiRequest,
  ImportKanjiRequest,
  ImportKanjiResponse,
  DashboardData,
  SearchExamsRequest,
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
export type KanjiGroupState = {
  /** 単語グループ一覧 */
  groups: KanjiGroup[];
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
  list: Exam[];
  total: number;
  detail: ExamDetail | null;
  status: ApiStatus;
};

export type ReviewTargetState = {
  items: ExamTarget[];
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
export type ExamSlice = {
  /** 単語テスト state */
  wordtest: WordTestState;
  fetchWordTests: () => Promise<void>;
  fetchWordTest: (wordTestId: string) => Promise<GetWordTestDetailResponse | null>;
  createWordTest: (request: CreateWordTestRequest) => Promise<CreateWordTestResponse>;
  applyWordTestGrading: (wordTestId: string, datas: GradingData[]) => Promise<void>;

  /** 復習テスト state */
  review: ReviewState;
  reviewTargets: ReviewTargetState;
  fetchExams: (params: SearchExamsRequest) => Promise<void>;
  createExam: (request: CreateExamRequest) => Promise<Exam>;
  fetchExam: (id: string) => Promise<void>;
  updateExamStatus: (id: string, request: UpdateExamStatusRequest) => Promise<void>;
  completeExam: (id: string) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  submitExamResults: (id: string, request: SubmitExamResultsRequest) => Promise<void>;
  fetchExamTargets: (params: {
    mode: 'MATERIAL' | 'KANJI';
    from: string;
    to: string;
    subject?: string;
  }) => Promise<void>;
};

/**
 * Material Slice
 */
export type MaterialSlice = {
  material: MaterialState;
  fetchMaterials: (params?: Record<string, unknown>) => Promise<void>;
  resetMaterialDetail: () => void;
  createMaterial: (request: CreateMaterialRequest) => Promise<CreateMaterialResponse>;
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
  updateQuestion: (materialId: string, questionId: string, request: UpdateQuestionRequest) => Promise<void>;
  deleteQuestion: (materialId: string, questionId: string) => Promise<void>;
  setQuestionChoice: (materialId: string, questionId: string, isCorrect: boolean) => Promise<void>;
  markQuestionCorrect: (materialId: string, questionId: string) => Promise<void>;
  markQuestionIncorrect: (materialId: string, questionId: string) => Promise<void>;
  completeMaterial: (materialId: string) => Promise<void>;
};

/**
 * Review Slice
 */
export type KanjiSlice = {
  kanji: KanjiState;
  fetchKanjiList: (params?: Record<string, unknown>) => Promise<void>;
  createKanji: (request: RegistKanjiRequest) => Promise<void>;
  fetchKanji: (id: string) => Promise<void>;
  updateKanji: (id: string, request: UpdateKanjiRequest) => Promise<void>;
  deleteKanji: (id: string) => Promise<void>;
  deleteManyKanji: (ids: string[]) => Promise<void>;
  importKanji: (request: ImportKanjiRequest) => Promise<ImportKanjiResponse>;

  /** 単語グループ（kanjiGroup）も漢字系として統合 */
  kanjiGroup: KanjiGroupState;
  fetchWordGroups: () => Promise<void>;
  createWordGroup: (request: CreateKanjiGroupRequest) => Promise<CreateKanjiGroupResponse>;
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
