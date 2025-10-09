// This is a placeholder file. The logic will be handled by a Genkit flow.
'use server';
import { generateLinkPreviewFlow } from '@/ai/flows/generate-link-preview';
import { LinkPreview } from '@/lib/types';

export async function generateLinkPreview(input: { url: string }): Promise<LinkPreview> {
  return await generateLinkPreviewFlow(input);
}
