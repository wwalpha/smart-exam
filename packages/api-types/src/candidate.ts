import type { ExamMode } from './exam';
import type { SubjectId } from './subject';

/** 検索結果（候補検索） */
export type CandidateSearchResult = {
  /** 候補ID */
  id: string;
  /** 科目 */
  subject: SubjectId;
  /** 次回日付 */
  nextTime: string;
  /** モード */
  mode: ExamMode;
  /** 候補表示文言 */
  questionText: string;
};

/** `POST /candidates/search` */
export type CandidateSearchRequest = {
  /** 科目での絞り込み */
  subject?: SubjectId;
  /** 候補モードでの絞り込み */
  mode?: ExamMode;
  /** 指定日以前の候補に絞り込む */
  nextTime?: string;
};

/** `POST /candidates/search` */
export type CandidateSearchResponse = {
  /** 候補検索結果一覧 */
  datas: CandidateSearchResult[];
};