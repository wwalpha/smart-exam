// Module: reviewTestPdfService responsibilities.

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ReviewTestDetail } from '@smart-exam/api-types';

import { ApiError } from '@/lib/apiError';


/** ReviewTestPdfService. */
export const ReviewTestPdfService = {
  generatePdfBuffer: async (
    review: ReviewTestDetail,
    options?: {
      /** 既定は VERIFIED のみ。ローカル検証などで GENERATED も含めたい場合に true。 */
      includeGenerated?: boolean;
    },
  ): Promise<Buffer> => {
    const mmToPt = (mm: number): number => (mm * 72) / 25.4;

    const a4Width = 595.28;
    const a4Height = 841.89;

    const margin = mmToPt(12);
    const headerGap = mmToPt(10);
    const itemGap = mmToPt(8);
    const afterQuestionGap = mmToPt(4);
    const answerLineGap = mmToPt(4);
    const answerBoxHeight = mmToPt(10);

    const numberColWidth = 60;
    const numberGap = 6;

    const titleFontSize = 18;
    const metaFontSize = 12;
    const questionFontSize = 14;
    const questionLineHeight = questionFontSize * 1.35;
    const metaLineFontSize = 10;
    const metaLineHeight = metaLineFontSize * 1.3;

    const title = `復習テスト (${review.subject})`;
    const meta = `作成日: ${review.createdDate}`;

    const fontBytes = await loadJapaneseFontBytes();

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // 日本語PDFの「ズレ/欠け」を防ぐため、フォントはサブセット化しない（全グリフ埋め込み）。
    // NOTE: 漢字PDFはサイズ削減のためサブセット化していたが、可変フォント/環境差で不安定になるため優先度を下げる。
    const jpFont = await pdfDoc.embedFont(fontBytes, { subset: false });

    const createPage = (params?: {
      pageWidth?: number;
      pageHeight?: number;
      titleSize?: number;
      metaSize?: number;
    }) => {
      const pageWidth = params?.pageWidth ?? a4Width;
      const pageHeight = params?.pageHeight ?? a4Height;
      const titleSize = params?.titleSize ?? titleFontSize;
      const metaSize = params?.metaSize ?? metaFontSize;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const contentWidth = pageWidth - margin * 2;

      const titleY = pageHeight - margin - titleSize;
      page.drawText(title, {
        x: margin,
        y: titleY,
        size: titleSize,
        font: jpFont,
        color: rgb(0, 0, 0),
      });

      const metaWidth = jpFont.widthOfTextAtSize(meta, metaSize);
      page.drawText(meta, {
        x: margin + contentWidth - metaWidth,
        y: titleY,
        size: metaSize,
        font: jpFont,
        color: rgb(0, 0, 0),
      });

      const cursorY = titleY - headerGap;
      return { page, contentWidth, cursorY, pageWidth, pageHeight };
    };

    const wrapTextByChar = (text: string, maxWidth: number): string[] => {
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
          const width = jpFont.widthOfTextAtSize(candidate, questionFontSize);

          if (width <= maxWidth) {
            current = candidate;
            continue;
          }

          if (current.length === 0) {
            // 1文字でも幅を超えるケースはそのまま描画
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

    const getQuestionText = (item: ReviewTestDetail['items'][number]): string => {
      return item.questionText ?? item.displayLabel ?? item.canonicalKey ?? item.kanji ?? item.targetId ?? '';
    };

    const getMaterialLine = (item: ReviewTestDetail['items'][number]): string => {
      const name = item.materialName ?? '';
      const date = item.materialDate ?? '';
      const key = item.canonicalKey ?? '';
      const parts = [name, date ? `(${date})` : '', key].filter((v) => v.length > 0);
      if (parts.length === 0) return '';
      return `教材: ${parts.join(' ')}`;
    };

    const renderKanjiWorksheetLayout = (params?: { includeGenerated?: boolean }): void => {
      void params;

      // A4横向き
      const pageWidth = a4Height;
      const pageHeight = a4Width;

      // 1ページ60問（左右30問ずつ）固定
      const itemsPerPage = 60;
      const rowsPerColumn = 30;
      const columnGap = mmToPt(8);

      // 右端の漢字記入枠（固定幅）
      const answerBoxWidth = mmToPt(22);
      const answerBoxGap = mmToPt(2.5);

      // 本文用フォントサイズ（行数固定のため小さめ）
      const baseFontSize = 9.5;
      const minFontSize = 8;

      const candidates = review.items.filter(
        (x) =>
          String(x.questionText ?? '').trim().length > 0 &&
          String(x.answerText ?? '').trim().length > 0 &&
          String(x.readingHiragana ?? '').trim().length > 0 &&
          Boolean(x.underlineSpec),
      );
      const items = candidates.slice(0, itemsPerPage);

      if (items.length === 0) {
        throw new ApiError('No printable kanji items (missing required fields)', 400, ['no_printable_items']);
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const contentWidth = pageWidth - margin * 2;
      const columnWidth = (contentWidth - columnGap) / 2;
      const leftX = margin;
      const rightX = margin + columnWidth + columnGap;

      const topY = pageHeight - margin;
      const availableHeight = topY - margin;
      const rowPitch = availableHeight / rowsPerColumn;

      const textMaxWidth = columnWidth - answerBoxWidth - answerBoxGap;

      const drawPromptWithUnderline = (p: {
        x: number;
        y: number;
        indexText: string;
        promptText: string;
        underlineSpec: { type: 'promptSpan'; start: number; length: number };
      }): void => {
        const start = p.underlineSpec.start;
        const length = p.underlineSpec.length;
        if (start < 0 || length <= 0 || start + length > p.promptText.length) {
          throw new ApiError('underlineSpec out of range', 400, ['invalid_underline_spec']);
        }

        const pre = p.promptText.slice(0, start);
        const target = p.promptText.slice(start, start + length);
        const post = p.promptText.slice(start + length);

        let fontSize = baseFontSize;
        const totalWidth = jpFont.widthOfTextAtSize(p.indexText + p.promptText, fontSize);
        if (totalWidth > textMaxWidth) {
          const scaled = (fontSize * textMaxWidth) / totalWidth;
          fontSize = Math.max(minFontSize, scaled);
        }

        const prefixWidth = jpFont.widthOfTextAtSize(p.indexText + pre, fontSize);
        const targetWidth = jpFont.widthOfTextAtSize(target, fontSize);
        const remainingForPost = textMaxWidth - (prefixWidth + targetWidth);
        if (remainingForPost < 0) {
          throw new ApiError('promptText is too long to render', 400, ['prompt_too_long']);
        }

        let postRendered = post;
        let truncated = false;
        while (postRendered.length > 0) {
          const w = jpFont.widthOfTextAtSize(postRendered, fontSize);
          if (w <= remainingForPost) break;
          truncated = true;
          postRendered = postRendered.slice(0, -1);
        }
        if (truncated && postRendered.length > 0) {
          while (postRendered.length > 0) {
            const w = jpFont.widthOfTextAtSize(postRendered + '…', fontSize);
            if (w <= remainingForPost) {
              postRendered = postRendered + '…';
              break;
            }
            postRendered = postRendered.slice(0, -1);
          }
        }

        page.drawText(p.indexText + pre, {
          x: p.x,
          y: p.y,
          size: fontSize,
          font: jpFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(target, {
          x: p.x + prefixWidth,
          y: p.y,
          size: fontSize,
          font: jpFont,
          color: rgb(0, 0, 0),
        });
        page.drawText(postRendered, {
          x: p.x + prefixWidth + targetWidth,
          y: p.y,
          size: fontSize,
          font: jpFont,
          color: rgb(0, 0, 0),
        });

        page.drawLine({
          start: { x: p.x + prefixWidth, y: p.y - mmToPt(0.6) },
          end: { x: p.x + prefixWidth + targetWidth, y: p.y - mmToPt(0.6) },
          thickness: 0.9,
          color: rgb(0, 0, 0),
        });
      };

      for (let local = 0; local < items.length; local += 1) {
        const col = local < rowsPerColumn ? 0 : 1;
        const row = local % rowsPerColumn;

        const baseX = col === 0 ? leftX : rightX;
        const rowTopY = topY - rowPitch * row;
        const rowBottomY = rowTopY - rowPitch;

        const item = items[local];
        const promptText = String((item as { questionText?: string }).questionText ?? '').trim();
        const readingHiragana = String((item as { readingHiragana?: string }).readingHiragana ?? '').trim();
        const underlineSpec = (item as { underlineSpec?: { type: 'promptSpan'; start: number; length: number } })
          .underlineSpec;

        if (!promptText || !readingHiragana || !underlineSpec) {
          throw new ApiError('Missing questionText/readingHiragana/underlineSpec', 400, ['missing_kanji_fields']);
        }

        const slice = promptText.slice(underlineSpec.start, underlineSpec.start + underlineSpec.length);
        if (slice !== readingHiragana) {
          throw new ApiError('underlineSpec does not match readingHiragana', 400, ['invalid_underline_spec']);
        }

        const indexText = `${local + 1}. `;
        const textY = rowTopY - baseFontSize;

        drawPromptWithUnderline({
          x: baseX,
          y: textY,
          indexText,
          promptText,
          underlineSpec,
        });

        // 右端: 漢字記入枠（枠のみ、解答は出さない）
        const boxHeight = rowPitch * 0.8;
        const boxX = baseX + columnWidth - answerBoxWidth;
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

    // 漢字復習テストは「1ページ30問固定(2列×15行)」
    if (review.mode === 'KANJI') {
      renderKanjiWorksheetLayout({ includeGenerated: options?.includeGenerated });
      const bytes = await pdfDoc.save();
      return Buffer.from(bytes);
    }

    let { page, contentWidth, cursorY } = createPage();

    const answerX = margin + numberColWidth + numberGap;
    const answerRightX = margin + contentWidth;
    const questionWidth = contentWidth - numberColWidth - numberGap;

    for (let idx = 0; idx < review.items.length; idx += 1) {
      const item = review.items[idx];
      const questionText = getQuestionText(item);
      const wrapped = wrapTextByChar(questionText, questionWidth);
      const materialLine = getMaterialLine(item);
      const materialWrapped = materialLine ? wrapTextByChar(materialLine, questionWidth) : [];
      const questionHeight = wrapped.length * questionLineHeight;
      const materialHeight = materialWrapped.length * metaLineHeight;
      const requiredHeight =
        questionHeight + materialHeight + afterQuestionGap + answerBoxHeight * 2 + answerLineGap + itemGap;

      if (cursorY - requiredHeight < margin) {
        ({ page, contentWidth, cursorY } = createPage());
      }

      // Question number
      const noText = item.canonicalKey ? `${item.canonicalKey}` : `${idx + 1}.`;
      const noWidth = jpFont.widthOfTextAtSize(noText, questionFontSize);
      page.drawText(noText, {
        x: margin + numberColWidth - noWidth,
        y: cursorY - questionFontSize,
        size: questionFontSize,
        font: jpFont,
        color: rgb(0, 0, 0),
      });

      // Question text (wrapped)
      for (const line of wrapped) {
        page.drawText(line, {
          x: answerX,
          y: cursorY - questionFontSize,
          size: questionFontSize,
          font: jpFont,
          color: rgb(0, 0, 0),
        });
        cursorY -= questionLineHeight;
      }

      // Material line (optional)
      for (const line of materialWrapped) {
        page.drawText(line, {
          x: answerX,
          y: cursorY - metaLineFontSize,
          size: metaLineFontSize,
          font: jpFont,
          color: rgb(0, 0, 0),
        });
        cursorY -= metaLineHeight;
      }

      cursorY -= afterQuestionGap;

      // Answer lines (2)
      for (let i = 0; i < 2; i += 1) {
        cursorY -= answerBoxHeight;
        page.drawLine({
          start: { x: answerX, y: cursorY },
          end: { x: answerRightX, y: cursorY },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        cursorY -= answerLineGap;
      }

      cursorY -= itemGap;
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  },
};

let cachedJapaneseFontBytes: Uint8Array | null = null;

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
      // try next
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
      // try next
    }
  }

  throw new Error(`Font asset is missing: ${variableTtfRelativePath} (or fallback: ${fontGzRelativePath})`);
};
