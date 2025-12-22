import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new BedrockRuntimeClient({ region: 'us-west-2' });

async function main() {
  const pdfPath = path.join(__dirname, '../../math.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('math.pdf not found at', pdfPath);
    return;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log('PDF Size:', pdfBuffer.length);
  const base64Pdf = pdfBuffer.toString('base64');

  // Claude 3.5 Sonnet v2 model ID
  const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

  const prompt = `
    You are an AI assistant that extracts question numbers from exam papers.
    Please analyze the attached PDF document.
    Identify all the question numbers (e.g., 1, 2, 3, 4(1), 4(2), etc.).
    Return the result as a JSON object with a key "questions" containing an array of strings.
    Example: {"questions": ["1", "2", "3(1)", "3(2)"]}
    Do not include any other text or explanation. Only the JSON.
  `;

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image', // Trying image type for PDF
            source: {
              type: 'base64',
              media_type: 'application/pdf', // Specifying PDF media type
              data: base64Pdf,
            },
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
