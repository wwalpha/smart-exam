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
