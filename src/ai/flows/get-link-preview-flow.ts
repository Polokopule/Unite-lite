'use server';
/**
 * @fileOverview An AI flow to fetch metadata from a URL to generate a link preview.
 *
 * - getLinkPreview - A function that fetches a URL and returns its metadata.
 * - LinkPreviewInputSchema - The input type for the getLinkPreview function.
 * - LinkPreviewOutputSchema - The return type for the getLinkpreview function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {LinkPreview} from '@/lib/types';

export const LinkPreviewInputSchema = z.object({
  url: z.string().url().describe('The URL to generate a preview for.'),
});

export const LinkPreviewOutputSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export async function getLinkPreview(
  url: string
): Promise<LinkPreview | null> {
  try {
    const result = await getLinkPreviewFlow({url});
    return result;
  } catch (error) {
    console.error('Error getting link preview:', error);
    return null;
  }
}

export const getLinkPreviewFlow = ai.defineFlow(
  {
    name: 'getLinkPreviewFlow',
    inputSchema: LinkPreviewInputSchema,
    outputSchema: LinkPreviewOutputSchema.nullable(),
  },
  async ({url}) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch URL: ${response.statusText}`);
        return null;
      }
      const text = await response.text();

      const {output} = await ai.generate({
        prompt: `Extract the title, meta description, and primary image (og:image or similar) from the following HTML content for the URL: ${url}. Provide a concise summary if a description is not available.

HTML:
\`\`\`html
${text.substring(0, 8000)}
\`\`\``,
        output: {
          schema: z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            imageUrl: z.string().url().optional(),
          }),
        },
      });

      if (!output) {
        return null;
      }

      return {
        url,
        title: output.title,
        description: output.description,
        imageUrl: output.imageUrl,
      };
    } catch (e: any) {
      console.error(`Error processing link preview for ${url}: ${e.message}`);
      return null;
    }
  }
);