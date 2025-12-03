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
  answer: z.string().describe('The AI\'s answer to the user\'s prompt, formatted in markdown.'),
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
4.  Format your answer using markdown. Your final output MUST be a single markdown string. For example, use paragraphs for text, lists for lists, and fenced code blocks for code.
5.  Your output must ONLY be the answer, formatted as a raw markdown string inside the 'answer' JSON field.

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


// Practice Mode
const PracticeModeInputSchema = z.object({
  originalCode: z.string().describe("The original, correct code snippet."),
  userAttempt: z.string().describe("The user's attempt to write the code from memory."),
});
export type PracticeModeInput = z.infer<typeof PracticeModeInputSchema>;

const PracticeModeOutputSchema = z.object({
  score: z.number().min(0).max(100).describe("An overall score from 0 to 100 representing the correctness and quality of the user's attempt."),
  evaluation: z.string().describe("A concise, one-paragraph summary of the user's attempt."),
  mistakes: z.array(z.string()).describe("A list of specific mistakes, if any."),
  suggestions: z.array(z.string()).describe("A list of suggestions for improvement."),
});
export type PracticeModeOutput = z.infer<typeof PracticeModeOutputSchema>;

export async function practiceMode(input: PracticeModeInput): Promise<PracticeModeOutput> {
    return practiceModeFlow(input);
}

const practiceModePrompt = ai.definePrompt({
    name: 'practiceModePrompt',
    input: { schema: PracticeModeInputSchema },
    output: { schema: PracticeModeOutputSchema },
    prompt: `You are a code practice evaluator. You will be given two versions of a code snippet: the original correct version and a user's attempt to recreate it from memory. Your task is to compare the two, evaluate the user's attempt, and provide constructive feedback.

    Your evaluation must be strict but fair. The goal is to help the user learn and improve.
    
    Here is the original code:
    \`\`\`
    {{{originalCode}}}
    \`\`\`
    
    Here is the user's attempt:
    \`\`\`
    {{{userAttempt}}}
    \`\`\`
    
    Now, evaluate the user's attempt based on the following criteria and provide your response in the requested JSON format:
    1.  **Correctness:** Does the code do what it's supposed to do? Are there syntax errors?
    2.  **Completeness:** Is any logic or functionality missing compared to the original?
    3.  **Style & Best Practices:** Does the code follow standard conventions? Is it clean and readable?
    
    Based on your analysis, provide a score from 0 to 100.
    - 100: Perfect or near-perfect match in functionality and style.
    - 80-99: Mostly correct but with minor mistakes or style issues.
    - 50-79: Functionally correct but has significant style issues or minor bugs.
    - 20-49: Major parts are incorrect or missing.
    - 0-19: Completely wrong or empty.
    
    Provide a brief, one-paragraph 'evaluation' of their work.
    List the specific 'mistakes' you found.
    Provide actionable 'suggestions' for what they could do better next time.
    
    Your final output MUST be in the specified JSON format.
    `,
});

const practiceModeFlow = ai.defineFlow(
    {
        name: 'practiceModeFlow',
        inputSchema: PracticeModeInputSchema,
        outputSchema: PracticeModeOutputSchema,
    },
    async (input) => {
        const { output } = await practiceModePrompt(input);
        return output!;
    }
);
