// src/ai/genkit.ts
import {genkit, Plugin, ai} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const plugins: Plugin[] = [];

if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI({apiVersion: 'v1beta'}));
}

genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export {ai};