import type { SubjectId } from '@smart-exam/api-types';

// 復習対象の種別
export type ReviewTargetType = 'MATERIAL' | 'KANJI';

// 復習候補データ
export type ReviewCandidate =
  | {
      // 問題復習候補
      targetType: 'MATERIAL';
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
      // 候補キー
      candidateKey: string;
    }
  | {
      // 漢字復習候補
      targetType: 'KANJI';
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
      // 候補キー
      candidateKey: string;
    };
