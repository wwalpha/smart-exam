import { beginCompletion, finishCompletion, submitResults, beginDeletion, removeMaterialTargets } from './workflow';
import { processQuestion } from './processQuestion';
import { listQuestionCandidates } from './candidates';

export const MaterialReviewsRepository = { beginCompletion, finishCompletion, submitResults, beginDeletion, processQuestion, removeMaterialTargets, listQuestionCandidates };
