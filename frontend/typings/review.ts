export type Exam = {
  id: string;
  testId: string; // Display ID
  subject: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ExamItem = {
  id: string;
  testId: string;
  targetType: 'QUESTION' | 'KANJI';
  targetId: string;
  // Expanded info
  displayLabel?: string;
  canonicalKey?: string;
  kanji?: string;
  materialSetName?: string;
  materialSetDate?: string;
};

export type ExamDetail = Exam & {
  items: ExamItem[];
  results: ExamResult[];
};

export type ExamResult = {
  targetId: string;
  isCorrect: boolean;
};
