import { EXAM_MODE } from '@smart-exam/api-types'
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

export const SEARCH_SUBJECT_OPTION = {
  all: 'ALL',
  kanji: 'KANJI',
} as const

export const CANDIDATE_MODE_LABEL = {
  [EXAM_MODE.MATERIAL]: '問題',
  [EXAM_MODE.KANJI]: '漢字',
} as const

export const CANDIDATE_SEARCH_PAGE_SIZE = 50

export const KANJI_IMPORT_SUCCESS_TOAST_STATE = 'kanji-import-success' as const

export const REGISTERED_MARK = '〇'

export const AUTH_TOKEN_STORAGE_KEY = 'smart_exam_access_token'

export const REFRESH_TOKEN_STORAGE_KEY = 'smart_exam_refresh_token'
