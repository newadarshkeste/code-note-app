'use server';

/**
 * @fileOverview An AI assistant flow that helps with code-related tasks.
 *
 * - aiAssistant - A function that takes the current code and a user prompt, and returns new code.
 * - AiAssistantInput - The input type for the aiAssistant function.
 * - AiAssistantOutput - The return type for the aiAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiAssistantInputSchema = z.object({
  code: z.string().describe('The current code or text in the editor.'),
  prompt: z.string().describe('The user\'s request or question.'),
});

export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  newCode: z.string().describe('The modified code or text to be placed back in the editor.'),
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
Your task is to understand the user's request and provide the new code or text that should replace the current editor content.

Follow these rules:
1.  Analyze the user's prompt to understand their intent (e.g., "add a function", "fix this bug", "explain this code", "convert this to typescript").
2.  If the user asks a question, provide the answer as a comment in the appropriate language, followed by the original code.
3.  If the user asks you to modify the code, return the FULL, modified code. Do not just return a diff or a snippet.
4.  If the user asks you to write new code, return the complete code they asked for.
5.  Maintain the original code's language and formatting unless the user asks you to change it.
6.  Your output must ONLY be the final code/text for the editor, formatted as a raw string inside the 'newCode' JSON field. Do not add any extra explanations or markdown formatting like \`\`\`.

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
