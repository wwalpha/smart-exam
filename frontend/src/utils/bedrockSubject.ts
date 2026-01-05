import { SUBJECT } from '@/lib/Consts';
import type { WordTestSubject } from '@typings/wordtest';

export type BedrockPromptSubject = 'math' | 'science' | 'society';

export const toBedrockPromptSubject = (subject: WordTestSubject): BedrockPromptSubject => {
  if (subject === SUBJECT.science) return 'science';
  if (subject === SUBJECT.society) return 'society';
  return 'math';
};
