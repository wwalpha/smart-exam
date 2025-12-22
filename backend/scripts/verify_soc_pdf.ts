import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new BedrockRuntimeClient({ region: 'us-west-2' });

async function main() {
  const pdfPath = path.join(__dirname, '../../soc.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('soc.pdf not found at', pdfPath);
    return;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log('PDF Size:', pdfBuffer.length);
  const base64Pdf = pdfBuffer.toString('base64');

  // Claude 4.5 Sonnet model ID
  const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

  const prompt = `
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

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64Pdf,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  };

  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Response:', JSON.stringify(responseBody, null, 2));

    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      console.log('Extracted Text:', responseBody.content[0].text);
    }
  } catch (error) {
    console.error('Error invoking Bedrock:', error);
  }
}

main();
