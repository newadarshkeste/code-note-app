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
  highlightedCode: z.string().describe('The code snippet with syntax highlighting, formatted as a raw, unescaped HTML string within a <pre><code> block. Do not use markdown backticks.'),
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
  prompt: `You are a code syntax highlighter. You will be given a code snippet. Your task is to:
1. Detect the programming language.
2. Return the code with syntax highlighting applied.
3. The output for 'highlightedCode' MUST be a raw HTML string. It should start with <pre> and contain nested <span> tags for syntax colors.
4. Do NOT escape the HTML tags. For example, use '<span>' not '&lt;span&gt;'.
5. Do NOT wrap the HTML output in markdown code fences.

Code Snippet:
\`\`\`
${'{{{code}}}'}
\`\`\`
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
