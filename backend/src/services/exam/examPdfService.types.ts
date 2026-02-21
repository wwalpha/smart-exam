import type { PDFPage } from 'pdf-lib';

// examPdfService.ts の描画ロジックで使う型定義。

// PDF描画時に利用するレイアウト設定
export type PdfRenderConfig = {
  // A4横幅（pt）
  a4Width: number;
  // A4縦幅（pt）
  a4Height: number;
  // ページ余白（pt）
  margin: number;
  // ヘッダー下の余白（pt）
  headerGap: number;
  // 問題ブロック間の余白（pt）
  itemGap: number;
  // 問題文後の余白（pt）
  afterQuestionGap: number;
  // 解答欄前の余白（pt）
  answerLineGap: number;
  // 解答欄高さ（pt）
  answerBoxHeight: number;
  // 番号列の幅（pt）
  numberColWidth: number;
  // 番号列と本文の間隔（pt）
  numberGap: number;
  // タイトル文字サイズ（pt）
  titleFontSize: number;
  // メタ情報文字サイズ（pt）
  metaFontSize: number;
  // 問題文文字サイズ（pt）
  questionFontSize: number;
  // 問題文行高（pt）
  questionLineHeight: number;
  // 補助情報文字サイズ（pt）
  metaLineFontSize: number;
  // 補助情報行高（pt）
  metaLineHeight: number;
};

// 各ページ描画中に保持する状態
export type PageContext = {
  // 描画対象ページ
  page: PDFPage;
  // 描画可能な横幅
  contentWidth: number;
  // 現在のYカーソル位置
  cursorY: number;
};

// 下線付き設問の下線指定情報
export type PromptUnderlineSpec = {
  // 下線指定の種別
  type: 'promptSpan';
  // 下線開始位置
  start: number;
  // 下線長
  length: number;
};
