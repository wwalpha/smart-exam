import type { SubjectId } from '@smart-exam/api-types';

export type ReviewTargetType = 'QUESTION' | 'KANJI';

export type ReviewCandidate =
  | {
      targetType: 'QUESTION';
      targetId: string;
      subject: SubjectId;
      registeredDate: string;
      dueDate: string | null;
      lastAttemptDate: string;
      candidateKey: string;
    }
  | {
      targetType: 'KANJI';
      targetId: string;
      subject: SubjectId;
      registeredDate: string;
      dueDate: string | null;
      lastAttemptDate: string;
      candidateKey: string;
    };
