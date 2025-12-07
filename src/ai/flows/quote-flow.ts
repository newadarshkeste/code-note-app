
'use server';

/**
 * @fileOverview An AI flow for generating motivational quotes.
 *
 * - generateQuote - A function that creates a quote based on a topic.
 * - GenerateQuoteInput - The input type for the generateQuote function.
 * - GenerateQuoteOutput - The return type for the generateQuote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuoteInputSchema = z.object({
  topic: z.string().describe('The subject or topic for the quote. e.g., "perseverance" or "learning to code".'),
});

export type GenerateQuoteInput = z.infer<typeof GenerateQuoteInputSchema>;

const GenerateQuoteOutputSchema = z.object({
  quote: z.string().describe('The generated quote text.'),
  author: z.string().describe('The person or source the quote is attributed to. If unknown, can be "Anonymous" or a descriptive source like "Developer Proverb".'),
});

export type GenerateQuoteOutput = z.infer<typeof GenerateQuoteOutputSchema>;

export async function generateQuote(input: GenerateQuoteInput): Promise<GenerateQuoteOutput> {
  return generateQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'quoteGeneratorPrompt',
  input: { schema: GenerateQuoteInputSchema },
  output: { schema: GenerateQuoteOutputSchema },
  prompt: `You are an expert curator of inspirational and insightful quotes.
Generate a motivational quote about "{{{topic}}}".
The quote should be concise and impactful.
Attribute the quote to a well-known person if possible. If the author is unknown or it's a general proverb, attribute it appropriately.
Your entire output must be the JSON object matching the specified format.
`,
});

const generateQuoteFlow = ai.defineFlow(
  {
    name: 'generateQuoteFlow',
    inputSchema: GenerateQuoteInputSchema,
    outputSchema: GenerateQuoteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
