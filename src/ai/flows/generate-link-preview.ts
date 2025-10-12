
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { LinkPreview } from '@/lib/types';

const LinkPreviewInputSchema = z.object({
  url: z.string().url(),
});

const LinkPreviewOutputSchema = z.object({
  url: z.string().url().describe('The original URL.'),
  title: z.string().optional().describe('The title of the page.'),
  description: z.string().optional().describe('A brief description of the page content.'),
  imageUrl: z.string().url().optional().describe('A relevant image URL from the page.'),
});

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

export const generateLinkPreviewFlow = ai.defineFlow(
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
