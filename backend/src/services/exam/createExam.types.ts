import type { ExamMode, SubjectId } from '@smart-exam/api-types';

import type { Repositories } from '@/repositories/createRepositories';

import type { ExamsService } from './index';

// 試験作成処理で扱う候補データ型
export type ReviewCandidate = {
  // 候補の種別
  targetType: 'QUESTION' | 'KANJI';
  // 対象ID
  targetId: string;
  // 科目ID
  subject: SubjectId;
  // 候補登録日
  registeredDate: string;
  // 次回出題予定日
  dueDate: string | null;
  // 最終回答日
  lastAttemptDate: string;
  // 候補キー（存在する場合のみ）
  candidateKey?: string;
};

// 試験作成処理に必要な依存関係
export type CreateExamDeps = {
  // リポジトリ群
  repositories: Repositories;
  // 試験詳細取得関数
  getExam: ExamsService['getExam'];
  // 試験削除関数
  deleteExam: ExamsService['deleteExam'];
};

// 候補一覧取得時の検索パラメータ
export type CandidateListParams = {
  // 科目ID
  subject: SubjectId;
  // 復習モード
  mode?: ExamMode;
  // 判定日（未指定時は当日）
  todayYmd?: string;
};
