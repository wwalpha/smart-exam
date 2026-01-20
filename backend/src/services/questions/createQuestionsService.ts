import type {
  CreateQuestionRequest,
  Question,
  QuestionListResponse,
  QuestionSearchResult,
  SearchQuestionsRequest,
} from '@smart-exam/api-types';

import { DateUtils } from '@/lib/dateUtils';
import { ReviewNextTime } from '@/lib/reviewNextTime';
import { createUuid } from '@/lib/uuid';
import type { MaterialQuestionTable } from '@/types/db';
import type { Repositories } from '@/repositories/createRepositories';
import { toSortNumber } from './toSortNumber';

export type QuestionsService = {
  listQuestions: (materialId: string) => Promise<QuestionListResponse['datas']>;
  createQuestion: (data: CreateQuestionRequest & { materialId: string }) => Promise<Question>;
  updateQuestion: (questionId: string, updates: Partial<CreateQuestionRequest>) => Promise<Question | null>;
  deleteQuestion: (questionId: string) => Promise<boolean>;
  searchQuestions: (params: SearchQuestionsRequest) => Promise<QuestionSearchResult[]>;
  markQuestionCorrect: (questionId: string) => Promise<boolean>;
  markQuestionIncorrect: (questionId: string) => Promise<boolean>;
  recalculateCandidatesForMaterial: (params: { materialId: string; registeredDate: string }) => Promise<void>;
};

export const createQuestionsService = (repositories: Repositories): QuestionsService => {
  const listQuestions: QuestionsService['listQuestions'] = async (materialId) => {
    const rows = await repositories.questions.listByMaterialId(materialId);
    return rows.map((q) => ({
      id: q.questionId,
      canonicalKey: q.canonicalKey,
      subject: q.subjectId,
      materialId: q.materialId,
      tags: [],
    }));
  };

  const createQuestion: QuestionsService['createQuestion'] = async (data) => {
    const id = createUuid();

    const dbItem: MaterialQuestionTable = {
      questionId: id,
      materialId: data.materialId,
      subjectId: data.subject,
      number: toSortNumber(data.canonicalKey),
      canonicalKey: data.canonicalKey,
    };

    await repositories.questions.create(dbItem);
    await repositories.materials.incrementQuestionCount(data.materialId, 1);

    const item: Question = {
      id,
      ...data,
    };

    return item;
  };

  const updateQuestion: QuestionsService['updateQuestion'] = async (questionId, updates) => {
    const existing = await repositories.questions.get(questionId);
    if (!existing) return null;

    const next = await repositories.questions.update(questionId, {
      ...(typeof updates.subject === 'string' ? { subjectId: updates.subject } : {}),
      ...(typeof updates.canonicalKey === 'string'
        ? { canonicalKey: updates.canonicalKey, number: toSortNumber(updates.canonicalKey) }
        : {}),
    });

    if (!next) return null;

    return {
      id: next.questionId,
      canonicalKey: next.canonicalKey,
      subject: next.subjectId,
      materialId: next.materialId,
      tags: updates.tags ?? [],
    };
  };

  const deleteQuestion: QuestionsService['deleteQuestion'] = async (questionId) => {
    const existing = await repositories.questions.get(questionId);
    if (!existing) return false;

    await repositories.reviewTestCandidates.deleteOpenCandidatesByTargetId({
      subject: existing.subjectId,
      targetId: questionId,
    });

    await repositories.questions.delete(questionId);
    await repositories.materials.incrementQuestionCount(existing.materialId, -1);

    return true;
  };

  const searchQuestions: QuestionsService['searchQuestions'] = async (params) => {
    const keyword = (params.keyword ?? '').trim().toLowerCase();
    const subject = (params.subject ?? '').trim().toLowerCase();

    const [questions, materials] = await Promise.all([repositories.questions.scanAll(), repositories.materials.list()]);
    const materialById = new Map(materials.map((x) => [x.materialId, x] as const));

    const filtered = questions.filter((q) => {
      if (subject && String(q.subjectId ?? '').toLowerCase() !== subject) return false;
      if (!keyword) return true;

      const haystack = [q.canonicalKey]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });

    return filtered.map((q): QuestionSearchResult => {
      const material = materialById.get(q.materialId);
      return {
        id: q.questionId,
        subject: q.subjectId,
        unit: '',
        questionText: q.canonicalKey,
        sourceMaterialId: q.materialId,
        sourceMaterialName: material?.title ?? '',
      };
    });
  };

  const markQuestionCorrect: QuestionsService['markQuestionCorrect'] = async (questionId) => {
    const q = await repositories.questions.get(questionId);
    if (!q) return false;

    const open = await repositories.reviewTestCandidates.getLatestOpenCandidateByTargetId({
      subject: q.subjectId,
      targetId: questionId,
    });

    if (open) {
      // 正解の場合は候補にしない（DBに残さない）
      await repositories.reviewTestCandidates.deleteCandidate({
        subject: q.subjectId,
        candidateKey: open.candidateKey,
      });
    }

    return true;
  };

  const markQuestionIncorrect: QuestionsService['markQuestionIncorrect'] = async (questionId) => {
    const q = await repositories.questions.get(questionId);
    if (!q) return false;

    const material = await repositories.materials.get(q.materialId);
    const preferred = material?.registeredDate ?? material?.materialDate ?? '';
    const baseDateYmd = DateUtils.isValidYmd(preferred) ? preferred : DateUtils.todayYmd();

    const open = await repositories.reviewTestCandidates.getLatestOpenCandidateByTargetId({
      subject: q.subjectId,
      targetId: questionId,
    });

    const currentCorrectCount = open ? open.correctCount : 0;
    if (open) {
      await repositories.reviewTestCandidates.closeCandidateIfMatch({
        subject: q.subjectId,
        candidateKey: open.candidateKey,
      });
    }

    const computed = ReviewNextTime.compute({
      mode: 'QUESTION',
      baseDateYmd,
      isCorrect: false,
      currentCorrectCount,
    });

    await repositories.reviewTestCandidates.createCandidate({
      subject: q.subjectId,
      questionId,
      mode: 'QUESTION',
      nextTime: computed.nextTime,
      correctCount: computed.nextCorrectCount,
      status: 'OPEN',
    });

    return true;
  };

  const recalculateCandidatesForMaterial: QuestionsService['recalculateCandidatesForMaterial'] = async (params) => {
    const questions = await repositories.questions.listByMaterialId(params.materialId);

    for (const q of questions) {
      const open = await repositories.reviewTestCandidates.getLatestOpenCandidateByTargetId({
        subject: q.subjectId,
        targetId: q.questionId,
      });

      if (!open) continue;

      await repositories.reviewTestCandidates.closeCandidateIfMatch({
        subject: q.subjectId,
        candidateKey: open.candidateKey,
      });

      // 旧仕様のデータで正解系のOPENが残っていた場合は、候補から除外する
      if (open.correctCount > 0) {
        await repositories.reviewTestCandidates.createCandidate({
          subject: q.subjectId,
          questionId: q.questionId,
          mode: 'QUESTION',
          nextTime: ReviewNextTime.EXCLUDED_NEXT_TIME,
          correctCount: open.correctCount,
          status: 'EXCLUDED',
        });
        continue;
      }

      const computed = ReviewNextTime.compute({
        mode: 'QUESTION',
        baseDateYmd: params.registeredDate,
        isCorrect: false,
        currentCorrectCount: 0,
      });

      await repositories.reviewTestCandidates.createCandidate({
        subject: q.subjectId,
        questionId: q.questionId,
        mode: 'QUESTION',
        nextTime: computed.nextTime,
        correctCount: computed.nextCorrectCount,
        status: 'OPEN',
      });
    }
  };

  return {
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    searchQuestions,
    markQuestionCorrect,
    markQuestionIncorrect,
    recalculateCandidatesForMaterial,
  };
};
