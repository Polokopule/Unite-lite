
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AIChatMessage } from '@/lib/types';

const UniteAIInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })),
  question: z.string(),
});

const uniteAIPrompt = ai.definePrompt({
  name: 'uniteAIPrompt',
  input: { schema: z.object({ question: z.string() }) },
  output: { format: 'text' },
  prompt: `
    You are Unite AI, a helpful assistant for the Unite platform.
    Your purpose is to answer questions about the platform's features, which include:
    - Users can create and sell courses.
    - Users earn points by watching ads.
    - Users can purchase courses using their earned points.
    - Businesses can create ad campaigns.
    - The platform has a community feed, groups, and direct messaging.
    
    Keep your answers concise and helpful.

    Question: {{{question}}}
  `,
});

export const uniteAIFlow = ai.defineFlow(
  {
    name: 'uniteAIFlow',
    inputSchema: UniteAIInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Note: The history is available in `input.history`, but this basic prompt doesn't use it yet.
    // A more advanced version could pass the history to the model.
    const { output } = await uniteAIPrompt({ question: input.question });
    return output!;
  }
);
