// Module: createKanjiQuestionsService responsibilities.

import type {
  KanjiQuestionGenerateReadingResponse,
  KanjiQuestionPatchRequest,
  KanjiQuestionPatchResponse,
  KanjiQuestionVerifyResponse,
} from '@smart-exam/api-types';
import type { Repositories } from '@/repositories/createRepositories';

import { createGenerateReading } from './generateReading';
import { createPatch } from './patch';
import { createVerify } from './verify';

/** Type definition for KanjiQuestionsService. */
export type KanjiQuestionsService = {
  generateReading: (id: string) => Promise<KanjiQuestionGenerateReadingResponse>;
  patch: (id: string, data: KanjiQuestionPatchRequest) => Promise<KanjiQuestionPatchResponse>;
  verify: (id: string) => Promise<KanjiQuestionVerifyResponse>;
};

/** Creates kanji questions service. */
export const createKanjiQuestionsService = (repositories: Repositories): KanjiQuestionsService => {
  const generateReading = createGenerateReading(repositories);
  const patch = createPatch(repositories);
  const verify = createVerify(repositories);

  return { generateReading, patch, verify };
};
