import { z } from 'zod';
import { DateUtils } from '@/lib/dateUtils';
import type { ReadContext, Row } from '../../../typings/learningRead';
import { get, ReadError, ref, seal, signal, str, unseal } from './common';

const storedRef = z.strictObject({
  kind: z.enum(['MATERIAL', 'EXAM']),
  id: z.string(),
  key: z.string(),
  etag: z.string().nullable(),
  versionId: z.string().nullable(),
});
const paths = {
  QUESTION: 'questionPdfPath',
  ANSWER: 'answerPdfPath',
  GRADED_ANSWER: 'answerSheetPath',
} as const;
const names = {
  QUESTION: 'questionPdfFilename',
  ANSWER: 'answerPdfFilename',
  GRADED_ANSWER: 'answerSheetFilename',
} as const;
export const safeOwnerId = (id: string) => {
  if (/[\\/]/.test(id) || id === '.' || id === '..') throw new ReadError('NOT_FOUND');
};
export const fileInfo = async (ctx: ReadContext, kind: 'MATERIAL' | 'EXAM', owner: Row, key: string) => {
  const ownerId = String(kind === 'MATERIAL' ? owner.materialId : owner.examId);
  safeOwnerId(ownerId);
  const prefix = `materials/${ownerId}/`;
  const role = kind === 'EXAM' ? 'EXAM_PAPER' : key.slice(prefix.length).split('/')[0];
  // prefixに加えて親レコード・役割を検証し、任意bucket/keyへの署名を防ぐ。
  if (
    kind === 'MATERIAL'
      ? !key.startsWith(prefix) || !Object.hasOwn(paths, role) || key.endsWith('/')
      : key !== `exams/${ownerId}.pdf` || (owner.pdfS3Key && owner.pdfS3Key !== key)
  )
    throw new ReadError('NOT_FOUND');
  const head = await ctx.repo.head(key, signal(ctx));
  if (!head) return null;
  if (head.ContentType !== 'application/pdf') return null;
  const roleKey = role as keyof typeof paths;
  const selected = kind === 'EXAM' ? true : owner[paths[roleKey]] === key;
  return {
    fileRef: seal(ctx, 'file', {
      kind,
      id: ownerId,
      key,
      etag: head.ETag ?? null,
      versionId: head.VersionId ?? null,
    }),
    ownerRef: ref(kind, ownerId),
    role,
    fileName: (selected && kind === 'MATERIAL' ? str(owner[names[roleKey]]) : null) ?? key.split('/').at(-1)!,
    contentType: head.ContentType,
    sizeBytes: head.ContentLength ?? null,
    lastModified: head.LastModified ? DateUtils.format(head.LastModified) : null,
    etag: head.ETag ?? null,
    versionId: head.VersionId ?? null,
    selected,
  };
};
export const accessFile = async (ctx: ReadContext, token: string) => {
  const parsed = storedRef.safeParse(unseal(ctx, 'file', token));
  if (!parsed.success) throw new ReadError('NOT_FOUND');
  const saved = parsed.data;
  const owner = await get(
    ctx,
    saved.kind === 'MATERIAL' ? 'MATERIALS' : 'EXAMS',
    saved.kind === 'MATERIAL' ? { materialId: saved.id } : { examId: saved.id },
  );
  if (!owner) throw new ReadError('NOT_FOUND');
  const info = await fileInfo(ctx, saved.kind, owner, saved.key);
  if (!info) throw new ReadError('FILE_NOT_GENERATED');
  if (info.etag !== saved.etag || info.versionId !== saved.versionId) throw new ReadError('FILE_CHANGED');
  return {
    ...info,
    fileRef: token,
    url: await ctx.repo.sign(saved.key, saved.versionId ?? undefined),
    expiresAt: DateUtils.format(Date.now() + 300_000),
    downloadMethod: 'GET',
  };
};
