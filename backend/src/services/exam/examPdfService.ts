// 試験詳細データから配布用 PDF を描画するサービス。

import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ExamDetail } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import type { PdfRenderConfig, PromptUnderlineSpec } from './examPdfService.types';

type MaterialGroup = {
  title: string;
  items: ExamDetail['items'];
};

// mm 指定を PDF 座標系(pt)へ変換する。
const mmToPt = (mm: number): number => (mm * 72) / 25.4;

// A4 縦向けレイアウトの標準設定を返す。
const buildPdfRenderConfig = (): PdfRenderConfig => {
  const questionFontSize = 14;
  const metaLineFontSize = 10;
  return {
    a4Width: 595.28,
    a4Height: 841.89,
    margin: mmToPt(12),
    headerGap: mmToPt(10),
    itemGap: mmToPt(8),
    afterQuestionGap: mmToPt(4),
    answerLineGap: mmToPt(4),
    answerBoxHeight: mmToPt(10),
    numberColWidth: 60,
    numberGap: 6,
    titleFontSize: 18,
    metaFontSize: 12,
    questionFontSize,
    questionLineHeight: questionFontSize * 1.35,
    metaLineFontSize,
    metaLineHeight: metaLineFontSize * 1.3,
  };
};

// YYYY-MM-DD を YYYY/MM/DD に変換する。
const formatYmdSlash = (date?: string): string => {
  if (!date) return '';
  return date.replaceAll('-', '/');
};

// MATERIAL のブロック見出し（提供元 + 教材名 + 日付）を組み立てる。
const getMaterialBlockTitle = (item: ExamDetail['items'][number]): string => {
  const provider = String(item.provider ?? '').trim();
  const materialName = String(item.materialName ?? '').trim();
  const materialDate = formatYmdSlash(item.materialDate);
  const parts = [provider, materialName, materialDate].filter((value) => value.length > 0);
  if (parts.length === 0) {
    return '教材';
  }
  return parts.join('　');
};

// MATERIAL の問題行に表示するラベルを決定する。
const getMaterialItemLabel = (item: ExamDetail['items'][number]): string => {
  const candidate =
    String(item.canonicalKey ?? '').trim() ||
    String(item.questionText ?? '').trim() ||
    String(item.displayLabel ?? '').trim() ||
    String(item.targetId ?? '').trim();
  return candidate.length > 0 ? candidate : '-';
};

// canonicalKey の自然順（例: 1-2 < 1-10）で安定ソートする。
const compareMaterialItemOrder = (left: ExamDetail['items'][number], right: ExamDetail['items'][number]): number => {
  const leftKey = String(left.canonicalKey ?? left.questionText ?? left.displayLabel ?? left.targetId ?? '');
  const rightKey = String(right.canonicalKey ?? right.questionText ?? right.displayLabel ?? right.targetId ?? '');
  return leftKey.localeCompare(rightKey, 'ja', { numeric: true, sensitivity: 'base' });
};

// 同一教材の問題をまとめて、PDF上で1セクションとして扱う。
const buildMaterialGroups = (review: ExamDetail): MaterialGroup[] => {
  const groups: MaterialGroup[] = [];
  const groupByKey = new Map<string, MaterialGroup>();

  for (const item of review.items) {
    const key = String(
      item.materialId ?? `${item.provider ?? ''}|${item.materialName ?? ''}|${item.materialDate ?? ''}`,
    );
    const existing = groupByKey.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    const nextGroup: MaterialGroup = {
      title: getMaterialBlockTitle(item),
      items: [item],
    };
    groupByKey.set(key, nextGroup);
    groups.push(nextGroup);
  }

  for (const group of groups) {
    // 左列から右列へ流す順序を揃えるため、教材内の問題順を固定化する。
    group.items.sort(compareMaterialItemOrder);
  }

  return groups;
};

// 指定幅に収まるよう末尾を省略しながらテキストを調整する。
const fitTextWithEllipsis = (text: string, maxWidth: number, font: PDFFont, fontSize: number): string => {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) {
    return text;
  }

  let trimmed = text;
  while (trimmed.length > 0) {
    const candidate = `${trimmed}…`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      return candidate;
    }
    trimmed = trimmed.slice(0, -1);
  }

  return '…';
};

// かな表記（ひらがな/カタカナ）差分を吸収するため、比較前にひらがなへ正規化する。
const normalizeKanaToHiragana = (s: string): string => {
  return s.replace(/[ァ-ヶ]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0x60);
  });
};

// 下線指定に合わせて設問を3分割で描画し、対象区間だけ下線を引く。
const drawPromptWithUnderline = (params: {
  page: PDFPage;
  font: PDFFont;
  x: number;
  y: number;
  indexText: string;
  promptText: string;
  underlineSpec: PromptUnderlineSpec;
  baseFontSize: number;
  minFontSize: number;
  textMaxWidth: number;
}): void => {
  const start = params.underlineSpec.start;
  const length = params.underlineSpec.length;
  if (start < 0 || length <= 0 || start + length > params.promptText.length) {
    throw new ApiError('underlineSpec out of range', 400, ['invalid_underline_spec']);
  }
  const pre = params.promptText.slice(0, start);
  const target = params.promptText.slice(start, start + length);
  const post = params.promptText.slice(start + length);
  let fontSize = params.baseFontSize;

  // 行全体が収まらないときは最小サイズまで縮小して描画する。
  const totalWidth = params.font.widthOfTextAtSize(params.indexText + params.promptText, fontSize);
  if (totalWidth > params.textMaxWidth) {
    const scaled = (fontSize * params.textMaxWidth) / totalWidth;
    fontSize = Math.max(params.minFontSize, scaled);
  }
  const prefixWidth = params.font.widthOfTextAtSize(params.indexText + pre, fontSize);
  const targetWidth = params.font.widthOfTextAtSize(target, fontSize);
  const remainingForPost = params.textMaxWidth - (prefixWidth + targetWidth);
  if (remainingForPost < 0) {
    throw new ApiError('promptText is too long to render', 400, ['prompt_too_long']);
  }
  let postRendered = post;
  let truncated = false;

  // 後半テキストのみ切り詰めて、下線区間は必ず表示する。
  while (postRendered.length > 0) {
    const width = params.font.widthOfTextAtSize(postRendered, fontSize);
    if (width <= remainingForPost) break;
    truncated = true;
    postRendered = postRendered.slice(0, -1);
  }
  if (truncated && postRendered.length > 0) {
    while (postRendered.length > 0) {
      const width = params.font.widthOfTextAtSize(postRendered + '…', fontSize);
      if (width <= remainingForPost) {
        postRendered = postRendered + '…';
        break;
      }
      postRendered = postRendered.slice(0, -1);
    }
  }

  params.page.drawText(params.indexText + pre, {
    x: params.x,
    y: params.y,
    size: fontSize,
    font: params.font,
    color: rgb(0, 0, 0),
  });
  params.page.drawText(target, {
    x: params.x + prefixWidth,
    y: params.y,
    size: fontSize,
    font: params.font,
    color: rgb(0, 0, 0),
  });
  params.page.drawText(postRendered, {
    x: params.x + prefixWidth + targetWidth,
    y: params.y,
    size: fontSize,
    font: params.font,
    color: rgb(0, 0, 0),
  });

  params.page.drawLine({
    start: { x: params.x + prefixWidth, y: params.y - mmToPt(0.6) },
    end: { x: params.x + prefixWidth + targetWidth, y: params.y - mmToPt(0.6) },
    thickness: 0.9,
    color: rgb(0, 0, 0),
  });
};

// 漢字モード専用: A4 横固定・2カラム（左右15問）ワークシートを描画する。
const renderKanjiWorksheetLayout = (params: {
  pdfDoc: PDFDocument;
  jpFont: PDFFont;
  review: ExamDetail;
  margin: number;
}): void => {
  // A4横向き
  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // 1ページ30問（左右15問ずつ）固定
  const rowsPerColumn = 15;
  const itemsPerPage = rowsPerColumn * 2;
  const columnGap = mmToPt(8);

  // 右端の漢字記入枠（固定幅）
  const answerBoxWidth = mmToPt(22);
  const answerBoxGap = mmToPt(2.5);

  // 15行固定での可読性を優先し、本文は少し大きめにする。
  const baseFontSize = 10.5;
  const minFontSize = 8.8;
  const promptBaselineOffsetRatio = 0.34;
  const answerLineOffsetRatio = 0.32;
  const candidates = params.review.items.filter(
    (x) =>
      String(x.questionText ?? '').trim().length > 0 &&
      String(x.answerText ?? '').trim().length > 0 &&
      String(x.readingHiragana ?? '').trim().length > 0 &&
      Boolean(x.underlineSpec),
  );
  if (candidates.length === 0) {
    throw new ApiError('No printable kanji items (missing required fields)', 400, ['no_printable_items']);
  }

  const contentWidth = pageWidth - params.margin * 2;
  const columnWidth = (contentWidth - columnGap) / 2;
  const leftX = params.margin;
  const rightX = params.margin + columnWidth + columnGap;
  const topY = pageHeight - params.margin;
  const availableHeight = topY - params.margin;
  const rowPitch = availableHeight / rowsPerColumn;
  const textMaxWidth = columnWidth - answerBoxWidth - answerBoxGap;

  for (let pageStart = 0; pageStart < candidates.length; pageStart += itemsPerPage) {
    const page = params.pdfDoc.addPage([pageWidth, pageHeight]);
    const pageItems = candidates.slice(pageStart, pageStart + itemsPerPage);

    for (let local = 0; local < pageItems.length; local += 1) {
      const col = local < rowsPerColumn ? 0 : 1;
      const row = local % rowsPerColumn;
      const baseX = col === 0 ? leftX : rightX;
      const rowTopY = topY - rowPitch * row;
      const rowBottomY = rowTopY - rowPitch;
      const item = pageItems[local];
      const promptText = String((item as { questionText?: string }).questionText ?? '').trim();
      const readingHiragana = String((item as { readingHiragana?: string }).readingHiragana ?? '').trim();
      const underlineSpec = (item as { underlineSpec?: PromptUnderlineSpec }).underlineSpec;
      if (!promptText || !readingHiragana || !underlineSpec) {
        throw new ApiError('Missing questionText/readingHiragana/underlineSpec', 400, ['missing_kanji_fields']);
      }

      // 下線指定が「読み仮名の位置」と一致していることを厳密に検証する。
      const slice = promptText.slice(underlineSpec.start, underlineSpec.start + underlineSpec.length);
      if (normalizeKanaToHiragana(slice) !== normalizeKanaToHiragana(readingHiragana)) {
        throw new ApiError('underlineSpec does not match readingHiragana', 400, ['invalid_underline_spec']);
      }

      drawPromptWithUnderline({
        page,
        font: params.jpFont,
        x: baseX,
        y: rowTopY - rowPitch * promptBaselineOffsetRatio,
        indexText: `${pageStart + local + 1}. `,
        promptText,
        underlineSpec,
        baseFontSize,
        minFontSize,
        textMaxWidth,
      });

      // 右端: 漢字記入欄は長方形ではなく下線で表現する。
      const boxX = baseX + columnWidth - answerBoxWidth;
      const lineY = rowBottomY + rowPitch * answerLineOffsetRatio;
      page.drawLine({
        start: { x: boxX, y: lineY },
        end: { x: boxX + answerBoxWidth, y: lineY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
  }
};

// MATERIAL モード専用: 教材ごとに見出しを出し、左右20問ずつの2カラムで描画する。
const renderMaterialWorksheetLayout = (params: {
  pdfDoc: PDFDocument;
  jpFont: PDFFont;
  review: ExamDetail;
  margin: number;
}): void => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const rowsPerColumn = 20;
  const itemsPerPage = rowsPerColumn * 2;
  const columnGap = mmToPt(8);
  const titleFontSize = 13;
  const rowFontSize = 11;
  const rowTextOffsetRatio = 0.72;
  const titleToRowsGap = mmToPt(8);
  const minLineWidth = mmToPt(12);
  const lineGap = mmToPt(2);

  const groups = buildMaterialGroups(params.review);

  for (const group of groups) {
    for (let pageStart = 0; pageStart < group.items.length; pageStart += itemsPerPage) {
      const page = params.pdfDoc.addPage([pageWidth, pageHeight]);
      const pageItems = group.items.slice(pageStart, pageStart + itemsPerPage);
      const titleText = pageStart === 0 ? group.title : `${group.title}（続き）`;

      const titleY = pageHeight - params.margin - titleFontSize;
      page.drawText(titleText, {
        x: params.margin,
        y: titleY,
        size: titleFontSize,
        font: params.jpFont,
        color: rgb(0, 0, 0),
      });

      const rowTopY = titleY - titleToRowsGap;
      const contentWidth = pageWidth - params.margin * 2;
      const columnWidth = (contentWidth - columnGap) / 2;
      const rowAreaHeight = rowTopY - params.margin;
      const rowPitch = rowAreaHeight / rowsPerColumn;
      const leftColumnCount = Math.ceil(pageItems.length / 2);

      for (let local = 0; local < pageItems.length; local += 1) {
        const col = local < leftColumnCount ? 0 : 1;
        const row = col === 0 ? local : local - leftColumnCount;
        const item = pageItems[local];
        const rawLabel = getMaterialItemLabel(item);
        const textMaxWidth = columnWidth - minLineWidth - lineGap;
        const label = fitTextWithEllipsis(rawLabel, textMaxWidth, params.jpFont, rowFontSize);

        const baseX = params.margin + (col === 1 ? columnWidth + columnGap : 0);
        const baselineY = rowTopY - rowPitch * row - rowPitch * rowTextOffsetRatio;
        page.drawText(label, {
          x: baseX,
          y: baselineY,
          size: rowFontSize,
          font: params.jpFont,
          color: rgb(0, 0, 0),
        });

        const textWidth = params.jpFont.widthOfTextAtSize(label, rowFontSize);
        const lineEndX = baseX + columnWidth;
        const lineStartX = Math.min(baseX + textWidth + lineGap, lineEndX - minLineWidth);
        page.drawLine({
          start: { x: lineStartX, y: baselineY - mmToPt(0.6) },
          end: { x: lineEndX, y: baselineY - mmToPt(0.6) },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    }
  }
};

// 試験モードに応じて PDF を生成してバッファで返す。
const generatePdfBufferImpl = async (
  review: ExamDetail,
  options?: {
    includeGenerated?: boolean;
  },
): Promise<Buffer> => {
  void options;
  const config = buildPdfRenderConfig();
  const fontBytes = await loadJapaneseFontBytes();
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 日本語PDFの「ズレ/欠け」を防ぐため、フォントはサブセット化しない（全グリフ埋め込み）。
  // NOTE: 漢字PDFはサイズ削減のためサブセット化していたが、可変フォント/環境差で不安定になるため優先度を下げる。
  const jpFont = await pdfDoc.embedFont(fontBytes, { subset: false });

  // 漢字は専用ワークシートレイアウトを使う。
  if (review.mode === 'KANJI') {
    renderKanjiWorksheetLayout({
      pdfDoc,
      jpFont,
      review,
      margin: config.margin,
    });
    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }
  renderMaterialWorksheetLayout({
    pdfDoc,
    jpFont,
    review,
    margin: config.margin,
  });
  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
};

// 外部公開 API。
export const ExamPdfService = {
  generatePdfBuffer: generatePdfBufferImpl,
};

let cachedJapaneseFontBytes: Uint8Array | null = null;

// 日本語フォントを読み込み、初回のみメモリにキャッシュする。
const loadJapaneseFontBytes = async (): Promise<Uint8Array> => {
  if (cachedJapaneseFontBytes) return cachedJapaneseFontBytes;

  const { readFile, stat } = await import('node:fs/promises');
  const path = await import('node:path');

  // 1) 推奨: Google Fonts 由来の可変フォント（TTF）をそのまま同梱して使用
  const variableTtfRelativePath = path.join('assets', 'fonts', 'NotoSansJP-VariableFont_wght.ttf');
  const variableCandidates = [
    path.join(process.cwd(), variableTtfRelativePath),
    path.join(process.cwd(), 'backend', variableTtfRelativePath),
  ];
  for (const candidate of variableCandidates) {
    try {
      const s = await stat(candidate);
      if (!s.isFile()) continue;
      const font = await readFile(candidate);
      cachedJapaneseFontBytes = new Uint8Array(font);
      return cachedJapaneseFontBytes;
    } catch {
      // 次候補パスを試す。
    }
  }

  // 2) 後方互換: 既存の gzip 同梱（サイズ削減）
  const { gunzip } = await import('node:zlib');
  const { promisify } = await import('node:util');
  const gunzipAsync = promisify(gunzip);
  const fontGzRelativePath = path.join('assets', 'fonts', 'NotoSansJP-wght.ttf.gz');
  const gzCandidates = [
    path.join(process.cwd(), fontGzRelativePath),
    path.join(process.cwd(), 'backend', fontGzRelativePath),
  ];
  for (const candidate of gzCandidates) {
    try {
      const s = await stat(candidate);
      if (!s.isFile()) continue;
      const gz = await readFile(candidate);
      const font = (await gunzipAsync(gz)) as Buffer;
      cachedJapaneseFontBytes = new Uint8Array(font);
      return cachedJapaneseFontBytes;
    } catch {
      // 次候補パスを試す。
    }
  }

  throw new Error(`Font asset is missing: ${variableTtfRelativePath} (or fallback: ${fontGzRelativePath})`);
};
