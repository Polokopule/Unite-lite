// This is a placeholder file. The logic will be handled by a Genkit flow.
'use server';
import { generateLinkPreview, LinkPreviewInput, LinkPreviewOutput } from '@/ai/flows/generate-link-preview';

export async function generateLinkPreviewService(input: LinkPreviewInput): Promise<LinkPreviewOutput> {
  return await generateLinkPreview(input);
}
