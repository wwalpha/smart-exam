import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ExamPdfService } from '../src/services/exam/examPdfService.ts';
import type { ExamDetail } from '@smart-exam/api-types';

const EXAM_MODE = {
  QUESTION: 'QUESTION',
  KANJI: 'KANJI',
} as const;

const EXPECTED_LINES = [
  '発表会でどくしょうをまかせられた。',
  'ふるさとの祖父母は、共にけんざいだ。',
  '駅までの道をめいかくに示す',
  'チームのけいせいが不利なまま試合が進む。',
  'きゅうご班として待機する。',
  '機械を使ってふくしゃする。',
] as const;

const todayYmd = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

async function main(): Promise<void> {
  const ymd = todayYmd();
  const testId = `verify-${ymd.replaceAll('-', '')}`;

  const exam: ExamDetail = {
    id: testId,
    testId,
    subject: '1',
    mode: EXAM_MODE.QUESTION,
    createdDate: ymd,
    status: 'IN_PROGRESS' as const,
    pdf: {
      url: `/api/exam/question/${testId}/pdf`,
      downloadUrl: `/api/exam/question/${testId}/pdf?download=1`,
    },
    count: EXPECTED_LINES.length,
    questions: EXPECTED_LINES.map((_v, i) => `q-${i + 1}`),
    results: [],
    items: EXPECTED_LINES.map((text, i) => ({
      id: `item-${i + 1}`,
      itemId: `item-${i + 1}`,
      testId,
      targetType: EXAM_MODE.QUESTION,
      targetId: `q-${i + 1}`,
      questionText: text,
    })),
  };

  const pdf = await ExamPdfService.generatePdfBuffer(exam);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, '..', '..');
  const outDir = path.join(repoRoot, 'tmp');
  await mkdir(outDir, { recursive: true });

  const outPath = path.join(outDir, `verify-exam-${testId}.pdf`);
  await writeFile(outPath, pdf);

  console.log(outPath);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
