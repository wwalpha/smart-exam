import type {
  ImportKanjiRequest,
  ImportKanjiResponse,
  Kanji,
  RegistKanjiRequest,
  SearchKanjiRequest,
  SearchKanjiResponse,
  SubjectId,
  UpdateKanjiRequest,
} from '@smart-exam/api-types';
import type { ExamCandidateTable, ExamHistoryTable, WordMasterTable } from '@/types/db';

// 漢字サービス全体の公開インターフェース。
export type KanjiService = {
  // 漢字一覧を取得する。
  listKanji: () => Promise<Kanji[]>;
  // 条件に一致する漢字を検索する。
  searchKanji: (params: SearchKanjiRequest) => Promise<SearchKanjiResponse>;
  // 漢字を新規作成する。
  registKanji: (data: RegistKanjiRequest) => Promise<Kanji>;
  // ID 指定で漢字を取得する。
  getKanji: (id: string) => Promise<Kanji | null>;
  // ID 指定で漢字を更新する。
  updateKanji: (id: string, data: UpdateKanjiRequest) => Promise<Kanji | null>;
  // ID 指定で漢字を削除する。
  deleteKanji: (id: string) => Promise<boolean>;
  // 複数 ID を一括削除する。
  deleteManyKanji: (ids: string[]) => Promise<void>;
  // 取り込みファイルから漢字を一括登録する。
  importKanji: (data: ImportKanjiRequest) => Promise<ImportKanjiResponse>;
};

// 下線表示の位置情報。
export type KanjiUnderlineSpec = {
  // 種別（現状は固定値）。
  type: 'promptSpan';
  // 下線開始位置。
  start: number;
  // 下線長。
  length: number;
};

// 取り込み1件分の履歴情報。
export type ImportedHistoryEntry = {
  // 実施日（YYYY-MM-DD）。
  submittedDate: string;
  // 正誤（OK=true / NG=false）。
  isCorrect: boolean;
};

// 復習候補1件作成に必要な入力。
export type BuildCandidateRowParams = {
  // 科目ID。
  subject: SubjectId;
  // 対象問題ID。
  questionId: string;
  // モード（漢字固定）。
  mode: 'KANJI';
  // 次回出題日。
  nextTime: string;
  // 連続正解数。
  correctCount: number;
  // 候補状態。
  status: 'OPEN' | 'CLOSED' | 'EXCLUDED';
  // 作成日時ISO（省略時は現在時刻）。
  createdAtIso?: string;
};

// 履歴から候補群を復元するための入力。
export type BuildCandidatesFromHistoriesParams = {
  // 科目ID。
  subject: SubjectId;
  // 対象単語ID。
  targetWordId: string;
  // 履歴配列。
  histories: ImportedHistoryEntry[];
  // 最終ステータス決定方針。
  finalStatus: 'AUTO' | 'EXCLUDED';
};

// updateKanji のデータ型。
export type UpdateKanjiData = Parameters<KanjiService['updateKanji']>[1];

// importKanji で解析した1行分データ。
export type ParsedImportRow = {
  // 元ファイルの行番号。
  lineNumber: number;
  // 元行文字列。
  content: string;
  // 問題文。
  question: string;
  // 解答。
  answer: string;
  // 復習履歴配列。
  histories: ImportedHistoryEntry[];
  // 新規採番した単語ID。
  wordId: string;
};

// 取り込み行解析フェーズの結果。
export type ParseRowsResult = {
  // 正常に解析できた行。
  rows: ParsedImportRow[];
  // 重複として除外した件数。
  duplicateCount: number;
  // 解析エラー件数。
  errorCount: number;
  // 解析エラー詳細。
  errors: ImportKanjiResponse['errors'];
};

// 取り込みバッチ構築フェーズの結果。
export type BatchBuildResult = {
  // word_master(kanji) へ投入する項目群。
  wordMasterItems: WordMasterTable[];
  // exam_candidates へ投入する候補群。
  candidatesToCreate: ExamCandidateTable[];
  // exam_histories へ投入する履歴群。
  historiesToCreate: ExamHistoryTable[];
  // 事前削除する候補ターゲット。
  candidateTargetsToDelete: Array<{ subject: SubjectId; targetId: string }>;
  // 成功件数。
  successCount: number;
  // エラー件数。
  errorCount: number;
  // エラー詳細。
  errors: ImportKanjiResponse['errors'];
  // 成功した questionId 一覧。
  questionIds: string[];
};