import type { ExamMode } from './exam';
import type { SubjectId } from './subject';

/** 検索結果（候補検索） */
export type CandidateSearchResult = {
  /** 候補ID */
  id: string;
  /** 科目 */
  subject: SubjectId;
  /** 種別 */
  unit?: string;
  /** 候補表示文言 */
  questionText: string;
  /** 出典教材ID */
  sourceMaterialId: string;
  /** 補足情報 */
  sourceMaterialName: string;
};

/** `POST /candidates/search` */
export type CandidateSearchRequest = {
  /** 科目での絞り込み */
  subject?: SubjectId;
  /** 候補モードでの絞り込み */
  mode?: ExamMode;
};

/** `POST /candidates/search` */
export type CandidateSearchResponse = {
  /** 候補検索結果一覧 */
  datas: CandidateSearchResult[];
};