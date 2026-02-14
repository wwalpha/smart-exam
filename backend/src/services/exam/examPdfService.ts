// Module: examPdfService responsibilities.

import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ExamDetail } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';

type PdfRenderConfig = {
  a4Width: number;
  a4Height: number;
  margin: number;
  headerGap: number;
  itemGap: number;
  afterQuestionGap: number;
  answerLineGap: number;
  answerBoxHeight: number;
  numberColWidth: number;
  numberGap: number;
  titleFontSize: number;
  metaFontSize: number;
  questionFontSize: number;
  questionLineHeight: number;
  metaLineFontSize: number;
  metaLineHeight: number;
};

type PageContext = {
  page: PDFPage;
  contentWidth: number;
  cursorY: number;
};

// 内部で利用する補助処理を定義する
const mmToPt = (mm: number): number => (mm * 72) / 25.4;

// 内部で利用する補助処理を定義する
const buildPdfRenderConfig = (): PdfRenderConfig => {
  // 処理で使う値を準備する
  const questionFontSize = 14;
  // 処理で使う値を準備する
  const metaLineFontSize = 10;

  // 処理結果を呼び出し元へ返す
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

// 内部で利用する補助処理を定義する
const createPage = (params: {
  pdfDoc: PDFDocument;
  jpFont: PDFFont;
  config: PdfRenderConfig;
  title: string;
  meta: string;
  pageWidth?: number;
  pageHeight?: number;
  titleSize?: number;
  metaSize?: number;
}): PageContext => {
  // 処理で使う値を準備する
  const pageWidth = params.pageWidth ?? params.config.a4Width;
  // 処理で使う値を準備する
  const pageHeight = params.pageHeight ?? params.config.a4Height;
  // 処理で使う値を準備する
  const titleSize = params.titleSize ?? params.config.titleFontSize;
  // 処理で使う値を準備する
  const metaSize = params.metaSize ?? params.config.metaFontSize;

  // 処理で使う値を準備する
  const page = params.pdfDoc.addPage([pageWidth, pageHeight]);
  // 処理で使う値を準備する
  const contentWidth = pageWidth - params.config.margin * 2;

  // 処理で使う値を準備する
  const titleY = pageHeight - params.config.margin - titleSize;
  page.drawText(params.title, {
    x: params.config.margin,
    y: titleY,
    size: titleSize,
    font: params.jpFont,
    color: rgb(0, 0, 0),
  });

  // 処理で使う値を準備する
  const metaWidth = params.jpFont.widthOfTextAtSize(params.meta, metaSize);
  page.drawText(params.meta, {
    x: params.config.margin + contentWidth - metaWidth,
    y: titleY,
    size: metaSize,
    font: params.jpFont,
    color: rgb(0, 0, 0),
  });

  // 処理で使う値を準備する
  const cursorY = titleY - params.config.headerGap;
  // 処理結果を呼び出し元へ返す
  return { page, contentWidth, cursorY };
};

// 内部で利用する補助処理を定義する
const wrapTextByChar = (text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] => {
  // 処理で使う値を準備する
  const normalized = text.replaceAll('\r\n', '\n');
  // 処理で使う値を準備する
  const paragraphs = normalized.split('\n');
  const lines: string[] = [];

  // 対象データを順番に処理する
  for (const paragraph of paragraphs) {
    // 条件に応じて処理を分岐する
    if (paragraph.length === 0) {
      lines.push('');
      continue;
    }

    // 後続処理で更新する値を初期化する
    let current = '';
    // 対象データを順番に処理する
    for (const ch of Array.from(paragraph)) {
      // 処理で使う値を準備する
      const candidate = current + ch;
      // 処理で使う値を準備する
      const width = font.widthOfTextAtSize(candidate, fontSize);

      // 条件に応じて処理を分岐する
      if (width <= maxWidth) {
        current = candidate;
        continue;
      }

      // 条件に応じて処理を分岐する
      if (current.length === 0) {
        lines.push(candidate);
        current = '';
        continue;
      }

      lines.push(current);
      current = ch;
    }

    // 条件に応じて処理を分岐する
    if (current.length > 0) {
      lines.push(current);
    }
  }

  // 処理結果を呼び出し元へ返す
  return lines;
};

// 内部で利用する補助処理を定義する
const getQuestionText = (item: ExamDetail['items'][number]): string => {
  // 処理結果を呼び出し元へ返す
  return item.questionText ?? item.displayLabel ?? item.canonicalKey ?? item.kanji ?? item.targetId ?? '';
};

// 内部で利用する補助処理を定義する
const getMaterialLine = (item: ExamDetail['items'][number]): string => {
  // 処理で使う値を準備する
  const name = item.materialName ?? '';
  // 処理で使う値を準備する
  const date = item.materialDate ?? '';
  // 処理で使う値を準備する
  const key = item.canonicalKey ?? '';
  // 処理で使う値を準備する
  const parts = [name, date ? `(${date})` : '', key].filter((v) => v.length > 0);
  // 条件に応じて処理を分岐する
  if (parts.length === 0) return '';
  // 処理結果を呼び出し元へ返す
  return `教材: ${parts.join(' ')}`;
};

// 内部で利用する補助処理を定義する
const drawPromptWithUnderline = (params: {
  page: PDFPage;
  font: PDFFont;
  x: number;
  y: number;
  indexText: string;
  promptText: string;
  underlineSpec: { type: 'promptSpan'; start: number; length: number };
  baseFontSize: number;
  minFontSize: number;
  textMaxWidth: number;
}): void => {
  // 処理で使う値を準備する
  const start = params.underlineSpec.start;
  // 処理で使う値を準備する
  const length = params.underlineSpec.length;
  // 条件に応じて処理を分岐する
  if (start < 0 || length <= 0 || start + length > params.promptText.length) {
    throw new ApiError('underlineSpec out of range', 400, ['invalid_underline_spec']);
  }

  // 処理で使う値を準備する
  const pre = params.promptText.slice(0, start);
  // 処理で使う値を準備する
  const target = params.promptText.slice(start, start + length);
  // 処理で使う値を準備する
  const post = params.promptText.slice(start + length);

  // 後続処理で更新する値を初期化する
  let fontSize = params.baseFontSize;
  // 処理で使う値を準備する
  const totalWidth = params.font.widthOfTextAtSize(params.indexText + params.promptText, fontSize);
  // 条件に応じて処理を分岐する
  if (totalWidth > params.textMaxWidth) {
    // 処理で使う値を準備する
    const scaled = (fontSize * params.textMaxWidth) / totalWidth;
    fontSize = Math.max(params.minFontSize, scaled);
  }

  // 処理で使う値を準備する
  const prefixWidth = params.font.widthOfTextAtSize(params.indexText + pre, fontSize);
  // 処理で使う値を準備する
  const targetWidth = params.font.widthOfTextAtSize(target, fontSize);
  // 処理で使う値を準備する
  const remainingForPost = params.textMaxWidth - (prefixWidth + targetWidth);
  // 条件に応じて処理を分岐する
  if (remainingForPost < 0) {
    throw new ApiError('promptText is too long to render', 400, ['prompt_too_long']);
  }

  // 後続処理で更新する値を初期化する
  let postRendered = post;
  // 後続処理で更新する値を初期化する
  let truncated = false;
  while (postRendered.length > 0) {
    // 処理で使う値を準備する
    const width = params.font.widthOfTextAtSize(postRendered, fontSize);
    // 条件に応じて処理を分岐する
    if (width <= remainingForPost) break;
    truncated = true;
    postRendered = postRendered.slice(0, -1);
  }

  // 条件に応じて処理を分岐する
  if (truncated && postRendered.length > 0) {
    while (postRendered.length > 0) {
      // 処理で使う値を準備する
      const width = params.font.widthOfTextAtSize(postRendered + '…', fontSize);
      // 条件に応じて処理を分岐する
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

// 内部で利用する補助処理を定義する
const renderKanjiWorksheetLayout = (params: {
  pdfDoc: PDFDocument;
  jpFont: PDFFont;
  review: ExamDetail;
  margin: number;
}): void => {
  // A4横向き
  const pageWidth = 841.89;
  // 処理で使う値を準備する
  const pageHeight = 595.28;

  // 1ページ60問（左右30問ずつ）固定
  const itemsPerPage = 60;
  // 処理で使う値を準備する
  const rowsPerColumn = 30;
  // 処理で使う値を準備する
  const columnGap = mmToPt(8);

  // 右端の漢字記入枠（固定幅）
  const answerBoxWidth = mmToPt(22);
  // 処理で使う値を準備する
  const answerBoxGap = mmToPt(2.5);

  // 本文用フォントサイズ（行数固定のため小さめ）
  const baseFontSize = 9.5;
  // 処理で使う値を準備する
  const minFontSize = 8;

  // 処理で使う値を準備する
  const candidates = params.review.items.filter(
    (x) =>
      String(x.questionText ?? '').trim().length > 0 &&
      String(x.answerText ?? '').trim().length > 0 &&
      String(x.readingHiragana ?? '').trim().length > 0 &&
      Boolean(x.underlineSpec),
  );
  // 処理で使う値を準備する
  const items = candidates.slice(0, itemsPerPage);

  // 条件に応じて処理を分岐する
  if (items.length === 0) {
    throw new ApiError('No printable kanji items (missing required fields)', 400, ['no_printable_items']);
  }

  // 処理で使う値を準備する
  const page = params.pdfDoc.addPage([pageWidth, pageHeight]);
  // 処理で使う値を準備する
  const contentWidth = pageWidth - params.margin * 2;
  // 処理で使う値を準備する
  const columnWidth = (contentWidth - columnGap) / 2;
  // 処理で使う値を準備する
  const leftX = params.margin;
  // 処理で使う値を準備する
  const rightX = params.margin + columnWidth + columnGap;

  // 処理で使う値を準備する
  const topY = pageHeight - params.margin;
  // 処理で使う値を準備する
  const availableHeight = topY - params.margin;
  // 処理で使う値を準備する
  const rowPitch = availableHeight / rowsPerColumn;
  // 処理で使う値を準備する
  const textMaxWidth = columnWidth - answerBoxWidth - answerBoxGap;

  // 対象データを順番に処理する
  for (let local = 0; local < items.length; local += 1) {
    // 処理で使う値を準備する
    const col = local < rowsPerColumn ? 0 : 1;
    // 処理で使う値を準備する
    const row = local % rowsPerColumn;

    // 処理で使う値を準備する
    const baseX = col === 0 ? leftX : rightX;
    // 処理で使う値を準備する
    const rowTopY = topY - rowPitch * row;
    // 処理で使う値を準備する
    const rowBottomY = rowTopY - rowPitch;

    // 処理で使う値を準備する
    const item = items[local];
    // 処理で使う値を準備する
    const promptText = String((item as { questionText?: string }).questionText ?? '').trim();
    // 処理で使う値を準備する
    const readingHiragana = String((item as { readingHiragana?: string }).readingHiragana ?? '').trim();
    // 処理で使う値を準備する
    const underlineSpec = (item as { underlineSpec?: { type: 'promptSpan'; start: number; length: number } })
      .underlineSpec;

    // 条件に応じて処理を分岐する
    if (!promptText || !readingHiragana || !underlineSpec) {
      throw new ApiError('Missing questionText/readingHiragana/underlineSpec', 400, ['missing_kanji_fields']);
    }

    // 処理で使う値を準備する
    const slice = promptText.slice(underlineSpec.start, underlineSpec.start + underlineSpec.length);
    // 条件に応じて処理を分岐する
    if (slice !== readingHiragana) {
      throw new ApiError('underlineSpec does not match readingHiragana', 400, ['invalid_underline_spec']);
    }

    drawPromptWithUnderline({
      page,
      font: params.jpFont,
      x: baseX,
      y: rowTopY - baseFontSize,
      indexText: `${local + 1}. `,
      promptText,
      underlineSpec,
      baseFontSize,
      minFontSize,
      textMaxWidth,
    });

    // 右端: 漢字記入枠（枠のみ、解答は出さない）
    const boxHeight = rowPitch * 0.8;
    // 処理で使う値を準備する
    const boxX = baseX + columnWidth - answerBoxWidth;
    // 処理で使う値を準備する
    const boxY = rowBottomY + (rowPitch - boxHeight) / 2;
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: answerBoxWidth,
      height: boxHeight,
      borderWidth: 1,
      borderColor: rgb(0, 0, 0),
      color: undefined,
    });
  }
};

// 内部で利用する補助処理を定義する
const generatePdfBufferImpl = async (
  review: ExamDetail,
  options?: {
    includeGenerated?: boolean;
  },
): Promise<Buffer> => {
  void options;

  // 処理で使う値を準備する
  const config = buildPdfRenderConfig();
  // 処理で使う値を準備する
  const title = `復習テスト (${review.subject})`;
  // 処理で使う値を準備する
  const meta = `作成日: ${review.createdDate}`;

  // 非同期で必要な値を取得する
  const fontBytes = await loadJapaneseFontBytes();
  // 非同期で必要な値を取得する
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 日本語PDFの「ズレ/欠け」を防ぐため、フォントはサブセット化しない（全グリフ埋め込み）。
  // NOTE: 漢字PDFはサイズ削減のためサブセット化していたが、可変フォント/環境差で不安定になるため優先度を下げる。
  const jpFont = await pdfDoc.embedFont(fontBytes, { subset: false });

  // 漢字復習テストはワークシートレイアウトで描画する
  if (review.mode === 'KANJI') {
    renderKanjiWorksheetLayout({
      pdfDoc,
      jpFont,
      review,
      margin: config.margin,
    });
    // 非同期で必要な値を取得する
    const bytes = await pdfDoc.save();
    // 処理結果を呼び出し元へ返す
    return Buffer.from(bytes);
  }

  // 後続処理で更新する値を初期化する
  let pageContext = createPage({
    pdfDoc,
    jpFont,
    config,
    title,
    meta,
  });

  // 処理で使う値を準備する
  const answerX = config.margin + config.numberColWidth + config.numberGap;
  // 処理で使う値を準備する
  const answerRightX = config.margin + pageContext.contentWidth;
  // 処理で使う値を準備する
  const questionWidth = pageContext.contentWidth - config.numberColWidth - config.numberGap;

  // 対象データを順番に処理する
  for (let idx = 0; idx < review.items.length; idx += 1) {
    // 処理で使う値を準備する
    const item = review.items[idx];
    // 処理で使う値を準備する
    const questionText = getQuestionText(item);
    // 処理で使う値を準備する
    const wrapped = wrapTextByChar(questionText, questionWidth, jpFont, config.questionFontSize);
    // 処理で使う値を準備する
    const materialLine = getMaterialLine(item);
    // 処理で使う値を準備する
    const materialWrapped = materialLine
      ? wrapTextByChar(materialLine, questionWidth, jpFont, config.metaLineFontSize)
      : [];

    // 処理で使う値を準備する
    const questionHeight = wrapped.length * config.questionLineHeight;
    // 処理で使う値を準備する
    const materialHeight = materialWrapped.length * config.metaLineHeight;
    // 処理で使う値を準備する
    const requiredHeight =
      questionHeight +
      materialHeight +
      config.afterQuestionGap +
      config.answerBoxHeight * 2 +
      config.answerLineGap +
      config.itemGap;

    // 条件に応じて処理を分岐する
    if (pageContext.cursorY - requiredHeight < config.margin) {
      pageContext = createPage({
        pdfDoc,
        jpFont,
        config,
        title,
        meta,
      });
    }

    // 処理で使う値を準備する
    const noText = item.canonicalKey ? `${item.canonicalKey}` : `${idx + 1}.`;
    // 処理で使う値を準備する
    const noWidth = jpFont.widthOfTextAtSize(noText, config.questionFontSize);
    pageContext.page.drawText(noText, {
      x: config.margin + config.numberColWidth - noWidth,
      y: pageContext.cursorY - config.questionFontSize,
      size: config.questionFontSize,
      font: jpFont,
      color: rgb(0, 0, 0),
    });

    // 対象データを順番に処理する
    for (const line of wrapped) {
      pageContext.page.drawText(line, {
        x: answerX,
        y: pageContext.cursorY - config.questionFontSize,
        size: config.questionFontSize,
        font: jpFont,
        color: rgb(0, 0, 0),
      });
      pageContext.cursorY -= config.questionLineHeight;
    }

    // 対象データを順番に処理する
    for (const line of materialWrapped) {
      pageContext.page.drawText(line, {
        x: answerX,
        y: pageContext.cursorY - config.metaLineFontSize,
        size: config.metaLineFontSize,
        font: jpFont,
        color: rgb(0, 0, 0),
      });
      pageContext.cursorY -= config.metaLineHeight;
    }

    pageContext.cursorY -= config.afterQuestionGap;

    // 対象データを順番に処理する
    for (let i = 0; i < 2; i += 1) {
      pageContext.cursorY -= config.answerBoxHeight;
      pageContext.page.drawLine({
        start: { x: answerX, y: pageContext.cursorY },
        end: { x: answerRightX, y: pageContext.cursorY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      pageContext.cursorY -= config.answerLineGap;
    }

    pageContext.cursorY -= config.itemGap;
  }

  // 非同期で必要な値を取得する
  const bytes = await pdfDoc.save();
  // 処理結果を呼び出し元へ返す
  return Buffer.from(bytes);
};

/** ExamPdfService. */
export const ExamPdfService = {
  generatePdfBuffer: generatePdfBufferImpl,
};

let cachedJapaneseFontBytes: Uint8Array | null = null;

// 内部で利用する補助処理を定義する
const loadJapaneseFontBytes = async (): Promise<Uint8Array> => {
  // 条件に応じて処理を分岐する
  if (cachedJapaneseFontBytes) return cachedJapaneseFontBytes;

  const { readFile, stat } = await import('node:fs/promises');
  // 非同期で必要な値を取得する
  const path = await import('node:path');

  // 1) 推奨: Google Fonts 由来の可変フォント（TTF）をそのまま同梱して使用
  const variableTtfRelativePath = path.join('assets', 'fonts', 'NotoSansJP-VariableFont_wght.ttf');
  // 処理で使う値を準備する
  const variableCandidates = [
    path.join(process.cwd(), variableTtfRelativePath),
    path.join(process.cwd(), 'backend', variableTtfRelativePath),
  ];

  // 対象データを順番に処理する
  for (const candidate of variableCandidates) {
    // 例外が発生しうる処理を実行する
    try {
      // 非同期で必要な値を取得する
      const s = await stat(candidate);
      // 条件に応じて処理を分岐する
      if (!s.isFile()) continue;
      // 非同期で必要な値を取得する
      const font = await readFile(candidate);
      cachedJapaneseFontBytes = new Uint8Array(font);
      // 処理結果を呼び出し元へ返す
      return cachedJapaneseFontBytes;
    } catch {
      // try next
    }
  }

  // 2) 後方互換: 既存の gzip 同梱（サイズ削減）
  const { gunzip } = await import('node:zlib');
  const { promisify } = await import('node:util');
  // 処理で使う値を準備する
  const gunzipAsync = promisify(gunzip);

  // 処理で使う値を準備する
  const fontGzRelativePath = path.join('assets', 'fonts', 'NotoSansJP-wght.ttf.gz');
  // 処理で使う値を準備する
  const gzCandidates = [
    path.join(process.cwd(), fontGzRelativePath),
    path.join(process.cwd(), 'backend', fontGzRelativePath),
  ];

  // 対象データを順番に処理する
  for (const candidate of gzCandidates) {
    // 例外が発生しうる処理を実行する
    try {
      // 非同期で必要な値を取得する
      const s = await stat(candidate);
      // 条件に応じて処理を分岐する
      if (!s.isFile()) continue;
      // 非同期で必要な値を取得する
      const gz = await readFile(candidate);
      // 非同期で必要な値を取得する
      const font = (await gunzipAsync(gz)) as Buffer;
      cachedJapaneseFontBytes = new Uint8Array(font);
      // 処理結果を呼び出し元へ返す
      return cachedJapaneseFontBytes;
    } catch {
      // try next
    }
  }

  throw new Error(`Font asset is missing: ${variableTtfRelativePath} (or fallback: ${fontGzRelativePath})`);
};
