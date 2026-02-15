import type { PDFPage } from 'pdf-lib';

export type PdfRenderConfig = {
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

export type PageContext = {
  page: PDFPage;
  contentWidth: number;
  cursorY: number;
};

export type PromptUnderlineSpec = {
  type: 'promptSpan';
  start: number;
  length: number;
};
