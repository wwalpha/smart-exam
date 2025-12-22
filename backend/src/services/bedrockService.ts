import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const analyzeExamPaper = async (s3Key: string): Promise<string[]> => {
  // 1. Get file from S3
  const getObjectParams = {
    Bucket: process.env.FILES_BUCKET_NAME,
    Key: s3Key,
  };
  const s3Response = await s3Client.send(new GetObjectCommand(getObjectParams));

  if (!s3Response.Body) {
    throw new Error('Empty file body from S3');
  }

  const fileBuffer = await streamToBuffer(s3Response.Body as Readable);

  // 2. Call Bedrock
  // Using Claude 3.5 Sonnet v2
  const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

  const prompt = `
    You are an AI assistant that extracts question numbers from exam papers.
    Please analyze the attached PDF document.
    Identify all the question numbers (e.g., 1, 2, 3, 4(1), 4(2), etc.).
    Return the result as a JSON object with a key "questions" containing an array of strings.
    Example: {"questions": ["1", "2", "3(1)", "3(2)"]}
    Do not include any other text or explanation. Only the JSON.
  `;

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
