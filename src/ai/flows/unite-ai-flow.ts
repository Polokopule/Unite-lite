'use server';
/**
 * @fileOverview A Genkit flow that acts as a helpful AI assistant for the Unite platform.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UniteAIInputSchema = z.object({
  history: z.array(z.any()).optional(),
  question: z.string(),
});

export const uniteAIFlow = ai.defineFlow(
  {
    name: 'uniteAIFlow',
    inputSchema: UniteAIInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const systemPrompt = `You are Unite AI, a friendly and helpful assistant for the Unite platform. Your goal is to answer user questions about Unite.

Unite is a platform with the following features:
- **Courses**: Users can create, sell, and buy courses using a points-based system.
- **Ads**: Businesses can create ad campaigns to reach users.
- **Points**: Users earn points by watching ads, which they can then spend on courses. Businesses earn points when their ads are viewed and spend points to create campaigns.
- **Community**: Users can connect with each other, view profiles, and follow one another.
- **Posts**: Users can create posts with text and media, comment on them, and share them.
- **Groups**: Users can create and join public or private (PIN-protected) groups for text, image, and voice messaging.
- **Direct Messages**: Users can have one-on-one private conversations.

When answering, be concise, friendly, and focus only on information relevant to the Unite platform. Do not answer questions unrelated to Unite. If you don't know the answer, say that you don't have that information.
`;

    const response = await ai.generate({
      prompt: input.question,
      history: input.history,
      config: {
        temperature: 0.5,
      },
      system: systemPrompt,
    });
    
    return response.text || "I'm sorry, I couldn't come up with a response.";
  }
);
