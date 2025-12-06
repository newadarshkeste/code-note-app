
'use server';

/**
 * @fileOverview An AI flow for generating multiple-choice quizzes.
 *
 * - generateQuiz - A function that creates a quiz based on a topic and optional file.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).describe('An array of 4-5 possible answers.'),
  answer: z.string().describe('The correct answer, which must be one of the strings from the options array.'),
});

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The subject or topic for the quiz. e.g., "Core Java" or "React Hooks".'),
  numQuestions: z.number().min(1).max(50).describe('The number of questions to generate.'),
  fileDataUri: z.string().optional().describe(
    "An optional file (e.g., PDF) to use as context for the quiz questions. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});

export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  title: z.string().describe('A suitable title for the generated quiz.'),
  questions: z.array(QuestionSchema).describe('The array of generated quiz questions.'),
});

export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'quizGeneratorPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an expert educator and test creator. Your task is to generate a multiple-choice quiz based on the provided topic and optional document.

Follow these rules strictly:
1.  Generate exactly {{{numQuestions}}} multiple-choice questions.
2.  The quiz should be based on the topic: "{{{topic}}}".
3.  {{#if fileDataUri}}If a file is provided, prioritize its content as the primary source material for the questions.{{/if}}
4.  Each question must have 4 or 5 distinct options.
5.  The 'answer' for each question must be an exact match to one of the strings in its 'options' array.
6.  Create a concise and relevant 'title' for the quiz.
7.  Do not include any introductory or concluding text in your response. Your entire output must be the JSON object matching the specified format.

{{#if fileDataUri}}
Context from attached file:
{{media url=fileDataUri}}
{{/if}}
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
