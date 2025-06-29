import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

dotenv.config();

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0,
  maxRetries: 2,
  // other params...
});

const aiMsg = await llm.invoke([
  [
    'system',
    'You are a helpful assistant that translates English to French. Translate the user sentence.',
  ],
  ['human', 'I love programming.'],
]);

console.log(aiMsg);
