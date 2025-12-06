
'use server';

import { aiAssistant, practiceMode } from '@/ai/flows/ai-assistant-flow';
import { generateQuiz } from '@/ai/flows/quiz-generator-flow';
import { z } from 'zod';

const assistantInputSchema = z.object({
    code: z.string(),
    prompt: z.string(),
    fileDataUri: z.string().optional(),
}).refine(data => data.prompt || data.fileDataUri, {
    message: "Either a prompt or a file must be provided.",
    path: ["prompt"],
});

export async function getAiAssistantResponse(code: string, prompt: string, fileDataUri?: string) {
    try {
        const validatedInput = assistantInputSchema.parse({ code, prompt, fileDataUri });
        const result = await aiAssistant(validatedInput);
        return { success: true, answer: result.answer };
    } catch (error) {
        console.error('Error getting AI assistant response:', error);
        const errorMessage = error instanceof z.ZodError 
            ? error.errors.map(e => e.message).join(', ') 
            : 'An unexpected error occurred.';
        return { success: false, error: errorMessage };
    }
}

const practiceModeInputSchema = z.object({
    originalCode: z.string(),
    userAttempt: z.string(),
});

export async function getPracticeModeFeedback(originalCode: string, userAttempt: string) {
    try {
        const validatedInput = practiceModeInputSchema.parse({ originalCode, userAttempt });
        const result = await practiceMode(validatedInput);
        return { success: true, feedback: result };
    } catch (error) {
        console.error('Error getting practice mode feedback:', error);
         const errorMessage = error instanceof z.ZodError 
            ? error.errors.map(e => e.message).join(', ') 
            : 'An unexpected error occurred.';
        return { success: false, error: errorMessage };
    }
}


const quizInputSchema = z.object({
    topic: z.string().min(3, "Topic must be at least 3 characters long."),
    numQuestions: z.number().min(1).max(50),
    fileDataUri: z.string().optional(),
});

export async function generateAiQuiz(topic: string, numQuestions: number, fileDataUri?: string) {
    try {
        const validatedInput = quizInputSchema.parse({ topic, numQuestions, fileDataUri });
        const result = await generateQuiz(validatedInput);
        return { success: true, quiz: result };
    } catch (error) {
        console.error('Error generating AI quiz:', error);
        const errorMessage = error instanceof z.ZodError 
            ? error.errors.map(e => e.message).join(', ') 
            : 'An unexpected error occurred while generating the quiz.';
        return { success: false, error: errorMessage };
    }
}
