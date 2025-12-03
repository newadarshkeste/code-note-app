'use server';

/**
 * @fileOverview An AI assistant flow that helps with code-related tasks.
 *
 * - aiAssistant - A function that takes the current code and a user prompt, and returns an answer.
 * - AiAssistantInput - The input type for the aiAssistant function.
 * - AiAssistantOutput - The return type for the aiAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiAssistantInputSchema = z.object({
  code: z.string().describe('The current code or text from the editor.'),
  prompt: z.string().describe('The user\'s request or question.'),
  fileDataUri: z.string().optional().describe(
    "An optional file (image or PDF) attached by the user, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});

export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s prompt, formatted in HTML.'),
});

export type AiAssistantOutput = z.infer<typeof AiAssistantOutputSchema>;

export async function aiAssistant(input: AiAssistantInput): Promise<AiAssistantOutput> {
  return aiAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: { schema: AiAssistantInputSchema },
  output: { schema: AiAssistantOutputSchema },
  prompt: `You are an expert AI programming assistant. You are integrated into a code editor.
You will be given the current content of the editor, a user prompt, and optionally an attached file (image or PDF).
Your task is to understand the user's request and provide a helpful answer based on all available information.

Follow these rules:
1.  Analyze the user's prompt to understand their intent (e.g., "explain this function", "what does this code do?", "how can I improve this?").
2.  If a file is attached, consider its content as primary context.
3.  Provide a clear and concise answer to the user's question based on the provided code, prompt, and/or file.
4.  Format your answer using markdown. Your final output MUST be rendered as a single HTML string. For example, use <p> for paragraphs, <ul> and <li> for lists, <pre><code> for code blocks, etc.
5.  Your output must ONLY be the answer, formatted as a raw HTML string inside the 'answer' JSON field. Do not add any extra explanations or markdown backticks.

User Prompt:
"{{{prompt}}}"

Current Editor Content:
\`\`\`
{{{code}}}
\`\`\`
{{#if fileDataUri}}
Attached File:
{{media url=fileDataUri}}
{{/if}}
`,
});

const aiAssistantFlow = ai.defineFlow(
  {
    name: 'aiAssistantFlow',
    inputSchema: AiAssistantInputSchema,
    outputSchema: AiAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
