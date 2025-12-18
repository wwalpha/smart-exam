import type {
  CreateWordTestResponse,
  WordTest,
  WordTestDetail,
  WordTestGradingValue,
  WordTestSubject,
} from './wordtest'

// API 呼び出しの状態（読込中/エラー）
export type ApiStatus = {
  // API 呼び出し中かどうか
  isLoading: boolean
  // 失敗時のエラーメッセージ（成功時は null）
  error: string | null
}

// 単語テスト機能の Zustand state
export type WordTestState = {
  // 単語テスト一覧（サマリ）
  datas: WordTest[]
  // 単語テスト詳細のキャッシュ（key=wordTestId）
  details: Record<string, WordTestDetail>
  // 採点結果のキャッシュ（key=wordTestId）
  gradings: Record<string, WordTestGradingValue[]>
  // API 状態
  status: ApiStatus
}

// 単語テスト機能の Zustand slice（state + actions）
export type WordTestSlice = {
  // 単語テスト state
  wordtest: WordTestState
  // 単語テスト一覧を取得する
  fetchWordTests: () => Promise<void>
  // 単語テスト詳細を取得する
  fetchWordTest: (wordTestId: string) => Promise<WordTest | null>
  // 単語テストを作成する
  createWordTest: (subject: WordTestSubject) => Promise<CreateWordTestResponse>
  // 採点結果を反映する
  applyWordTestGrading: (wordTestId: string, grading: WordTestGradingValue[]) => Promise<void>
}
