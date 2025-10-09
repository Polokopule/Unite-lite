'use server';
/**
 * @fileOverview A Genkit flow to generate link previews.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { LinkPreview } from '@/lib/types';

const LinkPreviewInputSchema = z.object({
  url: z.string().url().describe('The URL to generate a preview for.'),
});

const LinkPreviewOutputSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
}) as z.ZodType<LinkPreview>;

export const generateLinkPreviewFlow = ai.defineFlow(
  {
    name: 'generateLinkPreviewFlow',
    inputSchema: LinkPreviewInputSchema,
    outputSchema: LinkPreviewOutputSchema,
  },
  async (input) => {
    const prompt = `Extract the title, description, and a representative image URL from the webpage at the following URL. Provide the output in JSON format.
        URL: ${input.url}
        
        Example JSON output:
        {
            "url": "${input.url}",
            "title": "Example Title",
            "description": "A brief summary of the page content.",
            "imageUrl": "https://example.com/image.jpg"
        }
        `;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      config: {
        temperature: 0.2,
      },
    });

    try {
        const jsonText = llmResponse.text.replace(/```json\n?/, '').replace(/```$/, '');
        const parsed = JSON.parse(jsonText);
        return LinkPreviewOutputSchema.parse(parsed);
    } catch (e) {
      console.error("Failed to parse link preview from LLM response", e);
      // Return a fallback empty preview
      return {
          url: input.url,
          title: 'Unable to load preview',
          description: '',
          imageUrl: '',
      }
    }
  }
);
