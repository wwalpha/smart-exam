import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ReviewTestDetail } from '@smart-exam/api-types';

export const ReviewTestPdfService = {
  generatePdfBuffer: async (review: ReviewTestDetail): Promise<Buffer> => {
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

    // タイトルが欠けるケースがあるため、サブセット化しない（全グリフを埋め込む）
    const jpFont = await pdfDoc.embedFont(fontBytes, { subset: false });

    const createPage = () => {
      const page = pdfDoc.addPage([a4Width, a4Height]);
      const contentWidth = a4Width - margin * 2;

      const titleY = a4Height - margin - titleFontSize;
      page.drawText(title, {
        x: margin,
        y: titleY,
        size: titleFontSize,
        font: jpFont,
        color: rgb(0, 0, 0),
      });

      const metaWidth = jpFont.widthOfTextAtSize(meta, metaFontSize);
      page.drawText(meta, {
        x: margin + contentWidth - metaWidth,
        y: titleY,
        size: metaFontSize,
        font: jpFont,
        color: rgb(0, 0, 0),
      });

      let cursorY = titleY - headerGap;
      return { page, contentWidth, cursorY };
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
      return (
        item.questionText ??
        item.displayLabel ??
        item.canonicalKey ??
        item.kanji ??
        item.targetId ??
        ''
      );
    };

    const getMaterialLine = (item: ReviewTestDetail['items'][number]): string => {
      const name = item.materialName ?? '';
      const date = item.materialDate ?? '';
      const key = item.canonicalKey ?? '';
      const parts = [name, date ? `(${date})` : '', key].filter((v) => v.length > 0);
      if (parts.length === 0) return '';
      return `教材: ${parts.join(' ')}`;
    };

    const getKanjiQuestionText = (item: ReviewTestDetail['items'][number]): string => {
      return item.kanji ?? item.questionText ?? item.displayLabel ?? item.canonicalKey ?? item.targetId ?? '';
    };

    const renderKanjiFixedLayout = (): void => {
      const itemsPerPage = 30;
      const rowsPerColumn = 15;
      const columnGap = mmToPt(8);

      const totalPages = Math.max(1, Math.ceil(review.items.length / itemsPerPage));
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
        ({ page, contentWidth, cursorY } = createPage());

        const columnWidth = (contentWidth - columnGap) / 2;
        const leftX = margin;
        const rightX = margin + columnWidth + columnGap;

        // 15行に収めるため、ページ内の可用高さからピッチを算出する
        const topY = cursorY;
        const availableHeight = topY - margin;
        const rowPitch = availableHeight / rowsPerColumn;

        const start = pageIndex * itemsPerPage;
        const end = Math.min(review.items.length, start + itemsPerPage);

        for (let i = start; i < end; i += 1) {
          const local = i - start;
          const col = local < rowsPerColumn ? 0 : 1;
          const row = local % rowsPerColumn;

          const baseX = col === 0 ? leftX : rightX;
          const baseY = topY - rowPitch * row;
          const baselineY = baseY - questionFontSize;

          const item = review.items[i];
          const label = `問題${i + 1}`;
          const q = getKanjiQuestionText(item);
          const text = q ? `${label} ${q}` : `${label}`;

          page.drawText(text, {
            x: baseX,
            y: baselineY,
            size: questionFontSize,
            font: jpFont,
            color: rgb(0, 0, 0),
          });

          const textWidth = jpFont.widthOfTextAtSize(text, questionFontSize);
          const lineStartX = Math.min(baseX + textWidth + mmToPt(2), baseX + columnWidth - mmToPt(20));
          const lineEndX = baseX + columnWidth;

          if (lineStartX < lineEndX) {
            page.drawLine({
              start: { x: lineStartX, y: baselineY - mmToPt(1) },
              end: { x: lineEndX, y: baselineY - mmToPt(1) },
              thickness: 1,
              color: rgb(0, 0, 0),
            });
          }
        }
      }
    };

    let { page, contentWidth, cursorY } = createPage();

    const answerX = margin + numberColWidth + numberGap;
    const answerRightX = margin + contentWidth;
    const questionWidth = contentWidth - numberColWidth - numberGap;

    // 漢字復習テストは「1ページ30問固定(2列×15行)」
    if (review.mode === 'KANJI') {
      renderKanjiFixedLayout();
      const bytes = await pdfDoc.save();
      return Buffer.from(bytes);
    }

    for (let idx = 0; idx < review.items.length; idx += 1) {
      const item = review.items[idx];
      const questionText = getQuestionText(item);
      const wrapped = wrapTextByChar(questionText, questionWidth);
      const materialLine = getMaterialLine(item);
      const materialWrapped = materialLine ? wrapTextByChar(materialLine, questionWidth) : [];
      const questionHeight = wrapped.length * questionLineHeight;
      const materialHeight = materialWrapped.length * metaLineHeight;
      const requiredHeight =
        questionHeight +
        materialHeight +
        afterQuestionGap +
        answerBoxHeight * 2 +
        answerLineGap +
        itemGap;

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

  const { gunzip } = await import('node:zlib');
  const { promisify } = await import('node:util');
  const gunzipAsync = promisify(gunzip);
  const { readFile, stat } = await import('node:fs/promises');
  const path = await import('node:path');

  const fontRelativePath = path.join('assets', 'fonts', 'NotoSansJP-wght.ttf.gz');
  const candidates = [path.join(process.cwd(), fontRelativePath), path.join(process.cwd(), 'backend', fontRelativePath)];

  let fontGzPath: string | null = null;
  for (const candidate of candidates) {
    try {
      const s = await stat(candidate);
      if (s.isFile()) {
        fontGzPath = candidate;
        break;
      }
    } catch {
      // try next
    }
  }

  if (!fontGzPath) {
    throw new Error(`Font asset is missing: ${fontRelativePath}`);
  }

  const gz = await readFile(fontGzPath);
  const font = (await gunzipAsync(gz)) as Buffer;
  cachedJapaneseFontBytes = new Uint8Array(font);
  return cachedJapaneseFontBytes;
};
