import type { WordTestGradingValue, WordTestSubject } from '@typings/wordtest'

export const SUBJECT = {
  society: '3',
  japanese: '1',
} as const satisfies Record<string, WordTestSubject>

export const SUBJECT_LABEL: Record<WordTestSubject, string> = {
  [SUBJECT.society]: '社会',
  [SUBJECT.japanese]: '国語',
}

export const GRADING_VALUE = {
  incorrect: '0',
  correct: '1',
} as const satisfies Record<string, WordTestGradingValue>

export const GRADING_LABEL: Record<WordTestGradingValue, string> = {
  [GRADING_VALUE.incorrect]: '誤',
  [GRADING_VALUE.correct]: '正',
}
