// 試験詳細データから配布用 PDF を描画するサービス。

import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ExamDetail } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';
import type { PageContext, PdfRenderConfig, PromptUnderlineSpec } from './examPdfService.types';

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

// ヘッダーを描画し、新規ページの描画コンテキストを初期化する。
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
  const pageWidth = params.pageWidth ?? params.config.a4Width;
  const pageHeight = params.pageHeight ?? params.config.a4Height;
  const titleSize = params.titleSize ?? params.config.titleFontSize;
  const metaSize = params.metaSize ?? params.config.metaFontSize;
  const page = params.pdfDoc.addPage([pageWidth, pageHeight]);
  const contentWidth = pageWidth - params.config.margin * 2;
  const titleY = pageHeight - params.config.margin - titleSize;
  page.drawText(params.title, {
    x: params.config.margin,
    y: titleY,
    size: titleSize,
    font: params.jpFont,
    color: rgb(0, 0, 0),
  });
  const metaWidth = params.jpFont.widthOfTextAtSize(params.meta, metaSize);
  page.drawText(params.meta, {
    x: params.config.margin + contentWidth - metaWidth,
    y: titleY,
    size: metaSize,
    font: params.jpFont,
    color: rgb(0, 0, 0),
  });
  const cursorY = titleY - params.config.headerGap;
  return { page, contentWidth, cursorY };
};

// 日本語を文字単位で折り返し、指定幅内に収める。
const wrapTextByChar = (text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] => {
  const normalized = text.replaceAll('\r\n', '\n');
  const paragraphs = normalized.split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const ch of Array.from(paragraph)) {
      const candidate = current + ch;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current.length === 0) {
        lines.push(candidate);
        current = '';
        continue;
      }

      lines.push(current);
      current = ch;
    }
    if (current.length > 0) {
      lines.push(current);
    }
  }
  return lines;
};

// 問題文候補から表示優先順に1つ選んで返す。
const getQuestionText = (item: ExamDetail['items'][number]): string => {
  return item.questionText ?? item.displayLabel ?? item.canonicalKey ?? item.kanji ?? item.targetId ?? '';
};

// MATERIAL 用の教材補足行を構築する。
const getMaterialLine = (item: ExamDetail['items'][number]): string => {
  const name = item.materialName ?? '';
  const date = item.materialDate ?? '';
  const key = item.canonicalKey ?? '';
  const parts = [name, date ? `(${date})` : '', key].filter((v) => v.length > 0);
  if (parts.length === 0) return '';
  return `教材: ${parts.join(' ')}`;
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

// 試験モードに応じて PDF を生成してバッファで返す。
const generatePdfBufferImpl = async (
  review: ExamDetail,
  options?: {
    includeGenerated?: boolean;
  },
): Promise<Buffer> => {
  void options;
  const config = buildPdfRenderConfig();
  const title = `復習テスト (${review.subject})`;
  const meta = `作成日: ${review.createdDate}`;
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
  let pageContext = createPage({
    pdfDoc,
    jpFont,
    config,
    title,
    meta,
  });
  const answerX = config.margin + config.numberColWidth + config.numberGap;
  const answerRightX = config.margin + pageContext.contentWidth;
  const questionWidth = pageContext.contentWidth - config.numberColWidth - config.numberGap;

  // MATERIAL は「問題文 + 補足行 + 解答ライン2本」を縦に積み上げる。
  for (let idx = 0; idx < review.items.length; idx += 1) {
    const item = review.items[idx];
    const questionText = getQuestionText(item);
    const wrapped = wrapTextByChar(questionText, questionWidth, jpFont, config.questionFontSize);
    const materialLine = getMaterialLine(item);
    const materialWrapped = materialLine
      ? wrapTextByChar(materialLine, questionWidth, jpFont, config.metaLineFontSize)
      : [];
    const questionHeight = wrapped.length * config.questionLineHeight;
    const materialHeight = materialWrapped.length * config.metaLineHeight;
    const requiredHeight =
      questionHeight +
      materialHeight +
      config.afterQuestionGap +
      config.answerBoxHeight * 2 +
      config.answerLineGap +
      config.itemGap;

    // ブロックが収まらない場合は新ページを作成する。
    if (pageContext.cursorY - requiredHeight < config.margin) {
      pageContext = createPage({
        pdfDoc,
        jpFont,
        config,
        title,
        meta,
      });
    }
    const noText = item.canonicalKey ? `${item.canonicalKey}` : `${idx + 1}.`;
    const noWidth = jpFont.widthOfTextAtSize(noText, config.questionFontSize);
    pageContext.page.drawText(noText, {
      x: config.margin + config.numberColWidth - noWidth,
      y: pageContext.cursorY - config.questionFontSize,
      size: config.questionFontSize,
      font: jpFont,
      color: rgb(0, 0, 0),
    });
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
