import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new BedrockRuntimeClient({ region: 'us-west-2' });

async function main() {
  const pdfPath = path.join(__dirname, '../../science.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('science.pdf not found at', pdfPath);
    return;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log('PDF Size:', pdfBuffer.length);
  const base64Pdf = pdfBuffer.toString('base64');

  // Claude 4.5 Sonnet model ID
  const modelId = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

  const prompt = `
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
       - CRITICAL: Do not stop at the number. If there are Hiragana/Katakana choices that act as sub-questions (e.g. "Answer for あ", "Answer for い"), extract them.
    9. SPECIFIC CHECKS:
       - Check if Question 2 has a sub-question (2).
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
