export const ENV = {
  AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
  BEDROCK_REGION: process.env.BEDROCK_REGION || 'us-east-1',
  FILES_BUCKET_NAME: process.env.FILES_BUCKET_NAME || '',
  
  // DynamoDB Tables
  TABLE_SUBJECTS: process.env.TABLE_SUBJECTS || 'subjects',
  TABLE_TESTS: process.env.TABLE_TESTS || 'tests',
  TABLE_WORD_TESTS: process.env.TABLE_WORD_TESTS || 'word_tests',
  TABLE_QUESTIONS: process.env.TABLE_QUESTIONS || 'questions',
  TABLE_ATTEMPTS: process.env.TABLE_ATTEMPTS || 'attempts',
  TABLE_GRADED_SHEETS: process.env.TABLE_GRADED_SHEETS || 'graded_sheets',
  TABLE_WORDS: process.env.TABLE_WORDS || 'words',
  TABLE_WORD_GROUPS: process.env.TABLE_WORD_GROUPS || 'word_groups',
  TABLE_WORD_TEST_ATTEMPTS: process.env.TABLE_WORD_TEST_ATTEMPTS || 'word_test_attempts',
  TABLE_WORD_INCORRECTS: process.env.TABLE_WORD_INCORRECTS || 'word_incorrects',
  TABLE_EXAM_PAPERS: process.env.TABLE_EXAM_PAPERS || 'exam_papers',
  TABLE_EXAM_RESULTS: process.env.TABLE_EXAM_RESULTS || 'exam_results',
};
