
'use server';
/**
 * @fileOverview A chatbot AI flow for the Unite platform.
 *
 * - askUniteAI - A function that handles the chat process.
 * - UniteAIInput - The input type for the askUniteAI function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';
import { MessageData } from 'genkit';


const UniteAIInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })),
  question: z.string(),
});
export type UniteAIInput = z.infer<typeof UniteAIInputSchema>;

const systemPrompt = `
    You are Unite AI, a helpful assistant for the Unite platform.
    Your purpose is to answer questions about the platform's features, which include:
    - Users can create and sell courses.
    - Users earn points by watching ads.
    - Users can purchase courses using their earned points.
    - Businesses can create ad campaigns.
    - The platform has a community feed, groups, and direct messaging.
    
    Keep your answers concise and helpful.
  `;

const uniteAIFlow = ai.defineFlow(
  {
    name: 'uniteAIFlow',
    inputSchema: UniteAIInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const history: MessageData[] = [
        ...input.history.map(m => ({ role: m.role, content: m.parts.map(p => ({text: p.text}))})),
    ];

    const { output } = await ai.generate({
        model: 'googleai/gemini-pro',
        prompt: input.question,
        history,
        system: systemPrompt,
    });
    return output as string;
  }
);

export async function askUniteAI(input: UniteAIInput): Promise<string> {
    return uniteAIFlow(input);
}
