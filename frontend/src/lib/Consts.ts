import type { WordTestSubject } from '@typings/wordtest'

export const subject = {
  society: 'society',
  japanese: 'japanese',
} as const satisfies Record<string, WordTestSubject>

export const SubjectLabel: Record<WordTestSubject, string> = {
  [subject.society]: '社会',
  [subject.japanese]: '国語',
}
