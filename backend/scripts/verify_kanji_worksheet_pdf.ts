import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ExamPdfService } from '../src/services/exam/examPdfService.ts';
import type { ExamDetail } from '@smart-exam/api-types';

const EXAM_MODE = {
  KANJI: 'KANJI',
} as const;

const todayYmd = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const buildItems = (count: number) => {
  const base = {
    promptText: 'チームのけいせいが不利なまま試合が進む。',
    readingHiragana: 'けいせい',
    underlineSpec: { type: 'promptSpan' as const, start: 4, length: 4 },
    status: 'VERIFIED' as const,
  };

  return Array.from({ length: count }, (_v, i) => ({
    id: `item-${i + 1}`,
    itemId: `item-${i + 1}`,
    testId: 'dummy',
    targetType: EXAM_MODE.KANJI,
    targetId: `w-${i + 1}`,
    questionText: base.promptText,
    promptText: base.promptText,
    readingHiragana: base.readingHiragana,
    underlineSpec: base.underlineSpec,
    status: base.status,
  }));
};

async function main(): Promise<void> {
  const ymd = todayYmd();
  const testId = `verify-kanji-${ymd.replaceAll('-', '')}`;

  const exam: ExamDetail = {
    id: testId,
    testId,
    subject: '1',
    mode: EXAM_MODE.KANJI,
    createdDate: ymd,
    status: 'IN_PROGRESS' as const,
    pdf: {
      url: `/api/exam/kanji/${testId}/pdf`,
      downloadUrl: `/api/exam/kanji/${testId}/pdf?download=1`,
    },
    count: 60,
    questions: Array.from({ length: 60 }, (_v, i) => `w-${i + 1}`),
    results: [],
    items: buildItems(60),
  };

  const pdf = await ExamPdfService.generatePdfBuffer(exam);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, '..', '..');
  const outDir = path.join(repoRoot, 'tmp');
  await mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, `verify-kanji-worksheet-${testId}.pdf`);
  await writeFile(outPath, pdf);

  console.log(outPath);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
