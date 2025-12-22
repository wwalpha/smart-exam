export type ExamPaper = {
  paper_id: string;
  grade: string;
  subject: string;
  category: string;
  name: string; // e.g. "No.1"
  question_pdf_key: string;
  answer_pdf_key: string;
  created_at: string;
};

export type ExamResult = {
  result_id: string;
  paper_id?: string; // Optional link
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
