
'use server';
/**
 * @fileOverview A link preview generation AI flow.
 *
 * - generateLinkPreview - A function that handles generating a link preview.
 * - LinkPreviewInput - The input type for the generateLinkPreview function.
 * - LinkPreviewOutput - The return type for the generateLinkPreview function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LinkPreviewInputSchema = z.object({
  url: z.string().url(),
});
export type LinkPreviewInput = z.infer<typeof LinkPreviewInputSchema>;


const LinkPreviewOutputSchema = z.object({
  url: z.string().url().describe('The original URL.'),
  title: z.string().optional().describe('The title of the page.'),
  description: z.string().optional().describe('A brief description of the page content.'),
  imageUrl: z.string().url().optional().describe('A relevant image URL from the page.'),
});
export type LinkPreviewOutput = z.infer<typeof LinkPreviewOutputSchema>;


const linkPreviewPrompt = ai.definePrompt({
  name: 'linkPreviewPrompt',
  input: { schema: LinkPreviewInputSchema },
  output: { schema: LinkPreviewOutputSchema },
  prompt: `
    You are an expert at summarizing web pages for link previews.
    Given the following URL, extract the title, a concise description, and a relevant image URL.
    Provide the output in the requested JSON format.

    URL: {{{url}}}
  `,
});

const generateLinkPreviewFlow = ai.defineFlow(
  {
    name: 'generateLinkPreviewFlow',
    inputSchema: LinkPreviewInputSchema,
    outputSchema: LinkPreviewOutputSchema,
  },
  async (input) => {
    const { output } = await linkPreviewPrompt(input);
    return output!;
  }
);

export async function generateLinkPreview(input: LinkPreviewInput): Promise<LinkPreviewOutput> {
    return generateLinkPreviewFlow(input);
}
