/**
 * ダッシュボード表示用データ
 */
import type { SubjectId } from './subject';

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
    subject: SubjectId;
  }[];
  /** ロック中のアイテム数 */
  lockedCount: number;
  /** 在庫数（未実施の問題数など） */
  inventoryCount: number;
};
