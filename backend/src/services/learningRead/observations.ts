import { fileInfo } from './files';
import { DateUtils } from '@/lib/dateUtils';
import type { Observation, ReadContext, Row } from '../../../typings/learningRead';
import { bool, freshQuality, get, hash, ref, str, ReadError } from './common';

export const observe = async (
  ctx: ReadContext,
  detail: Row,
  exam: Row | null,
  initial = false,
): Promise<Observation> => {
  const targetId = String(initial ? detail.questionId : detail.targetId);
  const mode = initial || detail.targetType === 'MATERIAL' ? 'MATERIAL' : 'KANJI';
  const master = initial
    ? detail
    : await get(
        ctx,
        mode === 'MATERIAL' ? 'MATERIAL_QUESTIONS' : 'KANJI',
        mode === 'MATERIAL' ? { questionId: targetId } : { wordId: targetId },
      );
  const materialId = mode === 'MATERIAL' ? str(master?.materialId) : null;
  const material = materialId ? await get(ctx, 'MATERIALS', { materialId }) : null;
  const quality = freshQuality();
  if (!master) {
    quality.warnings.push('MISSING_TARGET');
    quality.missingSources.push(ref(mode === 'MATERIAL' ? 'MATERIAL_QUESTION' : 'KANJI', targetId));
  }
  if (mode === 'MATERIAL' && !material) {
    quality.warnings.push('MISSING_PARENT');
    if (materialId) quality.missingSources.push(ref('MATERIAL', materialId));
  }
  if (!initial && !exam) {
    quality.warnings.push('MISSING_PARENT');
    quality.missingSources.push(ref('EXAM', String(detail.examId)));
  }
  if (exam && exam.mode !== mode) quality.warnings.push('MODE_MISMATCH');
  const examResults: boolean[] = [];
  for (const result of (exam?.results ?? []) as { id: string; isCorrect: boolean }[])
    if (result.id === targetId) examResults.push(result.isCorrect);
  const choice = initial ? str(detail.choice) : null;
  const detailResult = initial ? null : bool(detail.isCorrect);
  const values = initial
    ? choice === 'CORRECT'
      ? [true]
      : choice === 'INCORRECT'
        ? [false]
        : []
    : [...examResults, ...(detailResult === null ? [] : [detailResult])];
  const conflict = new Set(values).size > 1;
  const isCorrect = conflict || values.length === 0 ? null : values[0];
  if (conflict) quality.warnings.push('GRADING_CONFLICT');
  if (examResults.length > 1) quality.warnings.push('DUPLICATE_RESULT');
  const rawDate = str(initial ? material?.registeredDate : exam?.submittedDate);
  const occurredOn = rawDate && DateUtils.isValidYmd(rawDate) ? rawDate : null;
  if (!occurredOn) quality.warnings.push(rawDate ? 'INVALID_DATE' : 'MISSING_DATE');
  const final = initial ? material?.isCompleted === true : exam?.status === 'COMPLETED';
  if (!final) quality.warnings.push('PROVISIONAL');
  const sourceRefs = initial
    ? [
        ref('MATERIAL_QUESTION', targetId, 'choice'),
        ref('MATERIAL', String(detail.materialId), 'registeredDate'),
      ]
    : [
        { ...ref('EXAM_DETAIL', String(detail.examId)), seq: Number(detail.seq) },
        ref('EXAM', String(detail.examId), 'results/submittedDate'),
      ];
  if (master && !initial) sourceRefs.push(ref(mode === 'MATERIAL' ? 'MATERIAL_QUESTION' : 'KANJI', targetId));
  if (materialId && !initial) sourceRefs.push(ref('MATERIAL', materialId));
  const content = {
    evidenceId: initial
      ? `material:${detail.materialId}:question:${targetId}:initial`
      : `exam:${detail.examId}:item:${detail.seq}`,
    sourceType: initial
      ? ('INITIAL_MATERIAL' as const)
      : mode === 'KANJI'
        ? ('KANJI_EXAM' as const)
        : ('REVIEW_EXAM' as const),
    target: { mode: mode as 'MATERIAL' | 'KANJI', targetId },
    materialId,
    examId: initial ? null : String(detail.examId),
    seq: initial ? null : Number(detail.seq),
    subject: str(master?.subjectId ?? master?.subject ?? exam?.subject) as Observation['subject'],
    canonicalKey: mode === 'MATERIAL' ? str(master?.canonicalKey) : null,
    occurredOn,
    rawOccurredOn: rawDate,
    dateSource: occurredOn
      ? initial
        ? ('MATERIAL_REGISTERED_DATE' as const)
        : ('EXAM_SUBMITTED_DATE' as const)
      : ('UNKNOWN' as const),
    datePrecision: occurredOn ? ('DAY' as const) : ('UNKNOWN' as const),
    materialDate: str(material?.materialDate),
    createdDate: str(exam?.createdDate),
    finalizationStatus: final ? ('FINAL' as const) : ('PROVISIONAL' as const),
    result: conflict
      ? ('CONFLICT' as const)
      : isCorrect === null
        ? ('UNGRADED' as const)
        : isCorrect
          ? ('CORRECT' as const)
          : ('INCORRECT' as const),
    isCorrect,
    rawResults: { choice, examResults, detailResult },
    questionText: mode === 'KANJI' ? str(master?.question) : null,
    correctAnswer: str(mode === 'KANJI' ? master?.answer : master?.correctAnswer),
    studentAnswer: null,
    readingHiragana: mode === 'KANJI' ? str(master?.readingHiragana) : null,
    underlineSpec:
      mode === 'KANJI' ? ((master?.underlineSpec ?? null) as Observation['underlineSpec']) : null,
    contentBasis: master ? ('CURRENT_MASTER' as const) : ('UNAVAILABLE' as const),
    fileRefs: [],
    sourceRefs,
    quality,
  };
  // 不正な原日付や親の変更も訂正として検出し、一時的な参照tokenはhashへ入れない。
  const fileRefs: string[] = [];
  if (material) {
    for (const path of ['questionPdfPath', 'answerPdfPath', 'answerSheetPath']) {
      if (typeof material[path] !== 'string') continue;
      try {
        const info = await fileInfo(ctx, 'MATERIAL', material, material[path] as string);
        if (info) fileRefs.push(info.fileRef);
      } catch (error) {
        if (!(error instanceof ReadError) || error.code !== 'NOT_FOUND') throw error;
        quality.warnings.push('INVALID_FILE_REFERENCE');
      }
    }
  }
  return { ...content, fileRefs, evidenceHash: hash(content) };
};
