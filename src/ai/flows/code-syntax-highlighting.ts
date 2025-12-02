'use server';

/**
 * @fileOverview Automatically detects the coding language and applies syntax highlighting to code snippets.
 *
 * - codeSyntaxHighlighting - A function that takes code as input and returns the code with syntax highlighting.
 * - CodeSyntaxHighlightingInput - The input type for the codeSyntaxHighlighting function.
 * - CodeSyntaxHighlightingOutput - The return type for the codeSyntaxHighlighting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeSyntaxHighlightingInputSchema = z.object({
  code: z.string().describe('The code snippet to be highlighted.'),
});

export type CodeSyntaxHighlightingInput = z.infer<typeof CodeSyntaxHighlightingInputSchema>;

const CodeSyntaxHighlightingOutputSchema = z.object({
  highlightedCode: z.string().describe('The code snippet with syntax highlighting applied.'),
  language: z.string().describe('The detected programming language of the code snippet.'),
});

export type CodeSyntaxHighlightingOutput = z.infer<typeof CodeSyntaxHighlightingOutputSchema>;

export async function codeSyntaxHighlighting(input: CodeSyntaxHighlightingInput): Promise<CodeSyntaxHighlightingOutput> {
  return codeSyntaxHighlightingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeSyntaxHighlightingPrompt',
  input: {schema: CodeSyntaxHighlightingInputSchema},
  output: {schema: CodeSyntaxHighlightingOutputSchema},
  prompt: `You are a code syntax highlighter. You will be given a code snippet, and you will return the code snippet with syntax highlighting applied. You will also detect the programming language of the code snippet.

  Code Snippet:
  ```
  {{{code}}}
  ```
  `,
});

const codeSyntaxHighlightingFlow = ai.defineFlow(
  {
    name: 'codeSyntaxHighlightingFlow',
    inputSchema: CodeSyntaxHighlightingInputSchema,
    outputSchema: CodeSyntaxHighlightingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
