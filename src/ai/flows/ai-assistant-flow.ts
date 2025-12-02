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
});

export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s prompt.'),
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
You will be given the current content of the editor and a user prompt.
Your task is to understand the user's request and provide a helpful answer.

Follow these rules:
1.  Analyze the user's prompt to understand their intent (e.g., "explain this function", "what does this code do?", "how can I improve this?").
2.  Provide a clear and concise answer to the user's question based on the provided code.
3.  Format your answer using markdown for readability if necessary (e.g., for code blocks, lists).
4.  Your output must ONLY be the answer, formatted as a raw string inside the 'answer' JSON field. Do not add any extra explanations.

User Prompt:
"{{{prompt}}}"

Current Editor Content:
\`\`\`
{{{code}}}
\`\`\`
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
