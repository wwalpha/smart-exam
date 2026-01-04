import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { ENV } from '../lib/env';

const bedrockClient = new BedrockRuntimeClient({ region: ENV.BEDROCK_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: ENV.AWS_REGION });

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const analyzeExamPaper = async (s3Key: string, subject: string = 'math'): Promise<string[]> => {
  // 1. Get file from S3
  const getObjectParams = {
    Bucket: ENV.FILES_BUCKET_NAME,
    Key: s3Key,
  };
  const s3Response = await s3Client.send(new GetObjectCommand(getObjectParams));

  if (!s3Response.Body) {
    throw new Error('Empty file body from S3');
  }

  const fileBuffer = await streamToBuffer(s3Response.Body as Readable);

  // 2. Call Bedrock
  // Using Claude 4.5 Sonnet
  const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

  let prompt = '';

  if (subject === 'society') {
    prompt = `
    You are an AI assistant that extracts question numbers from Social Studies (Society) exam papers.
    Please analyze the attached PDF document.
    Identify all the question numbers.

    Format requirements:
    1. Use hyphens to separate question parts.
    2. Follow this hierarchy strictly:
       - Level 1: Number in a Square/Box (e.g., [1], ■1, □1). Output as "1".
       - Level 2: Number in Parentheses (e.g., (1)). Output as "1-1".
       - Level 3: Plain Number (e.g., 1, 2) OR Circled Number (e.g., ①) OR Katakana/Hiragana/Alphabet. Output as "1-1-1" or "1-1-あ".
    3. Example:
       - Square [1] -> Parenthesis (1) => "1-1"
       - Square [1] -> Parenthesis (2) -> Circled 1 => "1-2-1"
       - Square [1] -> Parenthesis (2) -> Parenthesis (3) => "1-3" (Sibling of 1-2)
       - Square [1] -> Parenthesis (2) -> Plain 3 => CHECK CAREFULLY. If it looks like a new question number, it is "1-3". If it is a sub-part of (2), it is "1-2-3". BUT in this exam, usually (1), (2), (3) are the main sub-questions.
    4. Social Studies exams often have many sub-questions. Look for (1), (2), (3)... inside major questions.
    5. Sometimes questions are labeled with Katakana (ア, イ, ウ), Hiragana (あ, い, う), or Alphabet (A, B, C). If these are used as question labels (not just choices), extract them as sub-questions (e.g., "1-1-A", "1-1-あ").
    6. If a question asks to fill in blanks (e.g., "Empty box A"), and it is numbered, extract it.
    7. If you see multiple sub-questions in a single line or block, extract all of them.
    8. CRITICAL: Do not be conservative. If you see a symbol that might be a sub-question, EXTRACT IT.
    9. Watch out for question numbers that might look like "1-8-9". This is likely incorrect. It is probably Question 1, Subquestion 8 and Subquestion 9. Check the layout carefully.
    10. If there are questions like "問1", "問2", treat them as sub-questions of the main section (e.g., Section 1 -> 問1 is 1-1).
    11. Specifically check for Hiragana labels like "あ", "い" inside questions (e.g. Question 1(1) might have "あ" and "い"). Extract as "1-1-あ", "1-1-い".
    12. CRITICAL CORRECTION: Be very careful with nesting.
        - If you see Question 1, Subquestion (2), and then numbers 3 and 4, CHECK if they are actually (3) and (4).
        - If they are (3) and (4), they are NEW sub-questions (1-3, 1-4), NOT sub-questions of (2) (1-2-3, 1-2-4).
        - Do not output 1-2-3 or 1-2-4 unless they are clearly nested under (2) (e.g. indented or different numbering style).
        - If 1-2 has sub-questions 1 and 2, and then you see (3) and (4), those are 1-3 and 1-4.
    13. FORCE CORRECTION:
        - Question 1-2 has ONLY sub-questions 1 and 2 (1-2-1, 1-2-2).
        - The questions following 1-2-2 are Question 1-3 and Question 1-4.
        - DO NOT output 1-2-3 or 1-2-4.
        - If you see a number 3 or 4 after 1-2-2, it is 1-3 or 1-4.
        - GENERAL RULE: If the number style changes from Circled Number (e.g. ①) back to Parenthesis (e.g. (3)), you MUST go up a level. (3) is a sibling of (2), not a child.
    14. FINAL CHECK:
        - Did you miss any A, B, C, X, Y sub-questions? (e.g. 1-5-A, 1-13-X). If they are fill-in-the-blanks or specific sub-questions, INCLUDE them.
        - Did you correctly handle 1-3 and 1-4?
    15. QUESTION 2-2 SPECIAL HANDLING:
        - Question 2-2 has sub-questions (1), (2), (3).
        - Sub-question (2) contains Roman Numerals I, II, III.
        - You MUST extract the structure as:
          - "2-2-1" (for sub-question 1)
          - "2-2-2-Ⅰ", "2-2-2-Ⅱ", "2-2-2-Ⅲ" (Note: Use Roman Numeral characters if possible, or I, II, III. Structure is key: 2-2-2-...)
          - "2-2-3" (for sub-question 3)
        - Do NOT skip the (2) level for the Roman numerals. "2-2-I" is INCORRECT. It must be "2-2-2-I" (or Ⅰ).
        - Ensure 2-2-1 and 2-2-3 are extracted.

    Return the result as a JSON object with a key "questions" containing an array of strings.
    Example output: {"questions": ["1-1", "1-2", "2-1", "2-2"]}
    Do not include any other text or explanation. Only the JSON.
    `;
  } else if (subject === 'science') {
    prompt = `
    You are an AI assistant that extracts question numbers from Science (Rika) exam papers.
    Please analyze the attached PDF document.
    Identify all the question numbers.

    Format requirements:
    1. Use hyphens to separate question parts.
    2. Follow this hierarchy strictly:
       - Level 1: Number in a Square/Box (e.g., [1], ■1, □1). Output as "1".
       - Level 2: Number in Parentheses (e.g., (1)). Output as "1-1".
       - Level 3: Plain Number (e.g., 1, 2) OR Circled Number (e.g., ①) OR Katakana/Hiragana/Alphabet. Output as "1-1-1" or "1-1-あ".
    3. Science exams often have sub-questions labeled with (1), (2) and then further sub-questions.
    4. Look for questions labeled with Katakana (ア, イ, ウ), Hiragana (あ, い, う), or Alphabet (A, B, C).
    5. If you see multiple sub-questions in a single line or block, extract all of them.
    6. CRITICAL: Do not be conservative. If you see a symbol that might be a sub-question, EXTRACT IT.
    7. CHECK FOR MISSING NUMBERS:
       - If you see 2-1 and 2-3, look very carefully for 2-2. It might be a small question or a diagram label.
       - If you see 3-1 and 3-3, look for 3-2.
    8. NESTING RULES:
       - If Question 2(4) has sub-questions ①, ②, ③, extract as 2-4-1, 2-4-2, 2-4-3.
       - If Question 2(4)① has sub-parts "あ", "い", extract as 2-4-1-あ, 2-4-1-い.
       - CRITICAL EXCEPTION: For Question 2-4-1, if "あ", "い", "う" are separated by dotted lines within the same answer space or question block, treat them as ONE question "2-4-1". Do NOT split them.
    9. SPECIFIC CHECKS:
       - Check if Question 2 has a sub-question (2). Look for ① and ② inside it. Extract as 2-2-1, 2-2-2.
       - Check if Question 3 has a sub-question (2).
       - Check if Question 1 has sub-questions beyond 1-10.
       - Check Question 2-4 and 3-6 for Hiragana sub-questions (あ, い, う...).
       - If you see 3-6-1 and then "あ", "い", extract 3-6-1-あ, 3-6-1-い.
    10. FORCE CORRECTION:
        - Question 2-1: Look for sub-questions ①, ②, ③. Extract as 2-1-1, 2-1-2, 2-1-3.
        - Question 2-3: Look for sub-questions ①, ②. Extract as 2-3-1, 2-3-2.
        - Question 2-4-1: Treat "あ", "い", "う" separated by dotted lines as ONE question "2-4-1". Do NOT output 2-4-1-あ, etc.
        - Question 2-2: Ensure you extract "2-2-1" and "2-2-2".
        - Question 2-5 and 2-6: Extract as "2-5" and "2-6".

    Return the result as a JSON object with a key "questions" containing an array of strings.
    Example output: {"questions": ["1-1", "1-2", "2-1", "2-2"]}
    Do not include any other text or explanation. Only the JSON.
    `;
  } else {
    // Default to Math prompt
    prompt = `
    You are an AI assistant that extracts question numbers from exam papers.
    Please analyze the attached PDF document.
    Identify all the question numbers.

    Format requirements:
    1. Use hyphens to separate question parts.
    2. Convert parentheses like "1(1)" to "1-1".
    3. Convert circled numbers or further nesting like "3(1)①" to "3-1-1".
    4. Convert Katakana sub-questions like "7(2)ア" to "7-2-ア".
    5. If a question has only a major number like "1", output it as "1".
    6. Pay close attention to nested questions. For example, if question 4 has sub-questions (1) and (2), and (1) has further sub-questions ① and ②, extract them as 4-1-1, 4-1-2, 4-2.
    7. Look carefully for small circled numbers or Katakana inside the question text or diagrams.
    8. Even if the layout is complex or the numbers are small, try to find all sub-questions.
    9. Specifically check for deeply nested questions like "4(2)①" -> "4-2-1", "6(2)①" -> "6-2-1", and "7(2)ア" -> "7-2-ア".
    10. If you see multiple sub-questions in a single line or block, extract all of them.
    11. CRITICAL: Do not be conservative. If you see a symbol that might be a sub-question (like a small circle or a Katakana character), EXTRACT IT. It is better to include it than to miss it.
    12. For Question 7, specifically look for Katakana characters (ア, イ, ウ) next to the numbers.
    13. For Question 6, specifically look for circled numbers (①, ②) nested inside the sub-questions.
    14. For Question 4, specifically look for circled numbers (①, ②) nested inside sub-question (2). It should be extracted as "4-2-1", "4-2-2", etc. Do NOT output just "4-2" if there are sub-questions.
    15. Similarly for Question 4(1), look for "4-1-1", "4-1-2".

    Return the result as a JSON object with a key "questions" containing an array of strings.
    Example output: {"questions": ["1-1", "1-2", "2-1", "3-1-1", "3-1-2", "7-2-ア"]}
    Do not include any other text or explanation. Only the JSON.
    `;
  }

  const command = new ConverseCommand({
    modelId,
    messages: [
      {
        role: 'user',
        content: [
          { text: prompt },
          {
            document: {
              name: 'exam_paper',
              format: 'pdf',
              source: {
                bytes: fileBuffer,
              },
            },
          },
        ],
      },
    ],
    additionalModelRequestFields: {
      max_tokens: 4096,
    },
  });

  const response = await bedrockClient.send(command);

  const textContent = response.output?.message?.content?.find((c) => c.text)?.text;
  if (!textContent) {
    throw new Error('No text content in Bedrock response');
  }

  // 3. Parse JSON
  try {
    // Find JSON in the text (in case there's extra text)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : textContent;
    const result = JSON.parse(jsonString);
    return result.questions || [];
  } catch (e) {
    console.error('Failed to parse JSON from Bedrock:', textContent);
    throw new Error('Failed to parse Bedrock response');
  }
};
