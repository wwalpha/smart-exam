import type { Question } from './material';
import type { SubjectId } from './subject';

export type QuestionListResponse = {
  datas: Question[];
};

/** 検索結果（問題検索） */
export type QuestionSearchResult = {
  id: string;
  subject: SubjectId;
  unit?: string;
  questionText: string;
  sourceMaterialId: string;
  sourceMaterialName: string;
};

/** `POST /questions/search` */
export type SearchQuestionsRequest = {
  keyword?: string;
  subject?: SubjectId;
};

/** `POST /questions/search` */
export type SearchQuestionsResponse = {
  datas: QuestionSearchResult[];
};
