
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

// All fields are optional because the LLM might not find all of them.
const LinkPreviewOutputSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
}) as z.ZodType<LinkPreview>;

export const generateLinkPreviewFlow = ai.defineFlow(
  {
    name: 'generateLinkPreviewFlow',
    inputSchema: LinkPreviewInputSchema,
    outputSchema: LinkPreviewOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert at extracting metadata from a webpage.
        From the webpage at the URL below, extract the title, description, and a representative image URL.
        - The image URL should be a direct link to an image file (e.g., .jpg, .png, .gif, .webp).
        - Prioritize Open Graph images (og:image). If not available, find another suitable image.
        - Only return fields you are confident about. If you cannot find a piece of information, omit the field.

        Provide the output in a clean JSON format. Do not include any markdown formatting like \`\`\`json.
        
        URL: ${input.url}
        `;

    try {
        const llmResponse = await ai.generate({
          prompt: prompt,
          model: 'googleai/gemini-2.5-flash',
          config: {
            temperature: 0.1,
          },
          output: {
            format: 'json',
            schema: LinkPreviewOutputSchema
          }
        });

        const output = llmResponse.output();
        if (output) {
          return LinkPreviewOutputSchema.parse({ ...output, url: input.url });
        }
        
        // Fallback for empty or malformed output
        return {
            url: input.url,
            title: 'Unable to load preview',
            description: 'Could not retrieve information for this link.',
        };
    } catch (e) {
      console.error("Failed to generate or parse link preview from LLM response", e);
      // Return a fallback empty preview on any error
      return {
          url: input.url,
          title: 'Unable to load preview',
          description: 'Could not retrieve information for this link.',
      }
    }
  }
);
