import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  console.log('Bedrock handler invoked', JSON.stringify(event));

  try {
    // Example usage - this would need to be adapted to the specific model and prompt
    // const command = new InvokeModelCommand({
    //   modelId: "anthropic.claude-v2",
    //   contentType: "application/json",
    //   accept: "application/json",
    //   body: JSON.stringify({
    //     prompt: "\n\nHuman: Hello\n\nAssistant:",
    //     max_tokens_to_sample: 300,
    //   }),
    // });
    // const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Bedrock handler ready' }),
    };
  } catch (error) {
    console.error('Error invoking Bedrock', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
