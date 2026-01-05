/**
 * ダッシュボード表示用データ
 */
export type DashboardData = {
  /** 本日のテスト実施回数 */
  todayTestCount: number;
  /** 正答率の低い問題トップリスト */
  topIncorrectQuestions: {
    /** 問題ID */
    id: string;
    /** 表示ラベル */
    displayLabel: string;
    /** 不正解率 (0.0 - 1.0) */
    incorrectRate: number;
    /** 科目 */
    subject: string;
  }[];
  /** 正答率の低い漢字トップリスト */
  topIncorrectKanji: {
    /** 漢字ID */
    id: string;
    /** 漢字 */
    kanji: string;
    /** 科目 */
    subject: string;
    /** 最後に間違えた日時 (ISO 8601) */
    lastIncorrectAt: string;
  }[];
  /** ロック中のアイテム数 */
  lockedCount: number;
  /** 在庫数（未実施の問題数など） */
  inventoryCount: number;
};
