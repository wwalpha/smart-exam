import type { GradingValue, WordTestSubject } from '@typings/wordtest'

export const SUBJECT = {
  japanese: '1',
  science: '2',
  society: '3',
  math: '4',
} as const satisfies Record<string, WordTestSubject>

export const SUBJECT_LABEL: Record<WordTestSubject, string> = {
  [SUBJECT.japanese]: '国語',
  [SUBJECT.science]: '理科',
  [SUBJECT.society]: '社会',
  [SUBJECT.math]: '算数',
}

export const GRADING_VALUE = {
  incorrect: '0',
  correct: '1',
} as const satisfies Record<string, GradingValue>

export const GRADING_LABEL: Record<GradingValue, string> = {
  [GRADING_VALUE.incorrect]: '誤',
  [GRADING_VALUE.correct]: '正',
}
