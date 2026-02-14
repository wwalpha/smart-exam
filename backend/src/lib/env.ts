export const ENV = {
  AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
  BEDROCK_REGION: process.env.BEDROCK_REGION || 'us-east-1',
  FILES_BUCKET_NAME: process.env.FILES_BUCKET_NAME || '',

  // DynamoDB Tables
  TABLE_MATERIALS: process.env.TABLE_MATERIALS || 'materials',
  TABLE_MATERIAL_QUESTIONS: process.env.TABLE_MATERIAL_QUESTIONS || 'material_questions',
  TABLE_REVIEW_TESTS: process.env.TABLE_REVIEW_TESTS || 'tests',
  TABLE_REVIEW_TEST_CANDIDATES: process.env.TABLE_REVIEW_TEST_CANDIDATES || 'test_candidates',
  TABLE_WORD_MASTER: process.env.TABLE_WORD_MASTER || 'word_master',
};
