import type { Question } from './material';

export type QuestionListResponse = {
	datas: Question[];
};

/** 検索結果（問題検索） */
export type QuestionSearchResult = {
	id: string;
	subject: string;
	unit?: string;
	questionText: string;
	sourceMaterialId: string;
	sourceMaterialName: string;
};

/** `POST /questions/search` */
export type SearchQuestionsRequest = {
	keyword?: string;
	subject?: string;
};

/** `POST /questions/search` */
export type SearchQuestionsResponse = {
	datas: QuestionSearchResult[];
};
