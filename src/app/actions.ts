'use server';

import { aiAssistant } from '@/ai/flows/ai-assistant-flow';
import { z } from 'zod';

const assistantInputSchema = z.object({
    code: z.string(),
    prompt: z.string(),
    fileDataUri: z.string().optional(),
}).refine(data => data.prompt || data.fileDataUri, {
    message: "Either a prompt or a file must be provided.",
    path: ["prompt"], // you can assign the error to a specific path
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
