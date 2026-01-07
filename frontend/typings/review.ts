export type ReviewTest = {
  id: string;
  testId: string; // Display ID
  subject: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ReviewTestItem = {
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

export type ReviewTestDetail = ReviewTest & {
  items: ReviewTestItem[];
  results: ReviewTestResult[];
};

export type ReviewTestResult = {
  targetId: string;
  isCorrect: boolean;
};
