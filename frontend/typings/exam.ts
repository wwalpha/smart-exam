export type ExamPaper = {
  paper_id: string;
  grade: string;
  subject: string;
  category: string;
  name: string;
  question_pdf_key: string;
  answer_pdf_key: string;
  created_at: string;
};

export type ExamResult = {
  result_id: string;
  paper_id?: string;
  grade: string;
  subject: string;
  category: string;
  name: string;
  title: string;
  test_date: string;
  score?: number;
  graded_pdf_key?: string;
  details: {
    number: number;
    is_correct: boolean;
  }[];
  created_at: string;
};

export type CreateExamPaperRequest = Omit<ExamPaper, 'paper_id' | 'created_at'>;
export type CreateExamResultRequest = Omit<ExamResult, 'result_id' | 'created_at'>;

export type ListExamPapersResponse = {
  datas: ExamPaper[];
};

export type ListExamResultsResponse = {
  datas: ExamResult[];
};

export type UploadUrlResponse = {
  url: string;
  key: string;
};
