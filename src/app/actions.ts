'use server';

import { codeSyntaxHighlighting } from '@/ai/flows/code-syntax-highlighting';
import { aiAssistant } from '@/ai/flows/ai-assistant-flow';
import { z } from 'zod';

const highlightInputSchema = z.string().min(1, { message: 'Code cannot be empty' });

export async function getHighlightedCode(code: string) {
  try {
    const validatedCode = highlightInputSchema.parse(code);
    if (!validatedCode || validatedCode.trim() === '') {
      return { highlightedCode: code, language: 'plaintext' };
    }
    const result = await codeSyntaxHighlighting({ code: validatedCode });
    return result;
  } catch (error) {
    console.error('Error highlighting code:', error);
    // In case of error (e.g., validation, API failure), return the original code wrapped in pre/code tags
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return { highlightedCode: `<pre><code>${safeCode}</code></pre>`, language: 'plaintext' };
  }
}

const assistantInputSchema = z.object({
    code: z.string(),
    prompt: z.string().min(1, { message: 'Prompt cannot be empty' }),
});

export async function getAiAssistantResponse(code: string, prompt: string) {
    try {
        const validatedInput = assistantInputSchema.parse({ code, prompt });
        const result = await aiAssistant(validatedInput);
        return { success: true, newCode: result.newCode };
    } catch (error) {
        console.error('Error getting AI assistant response:', error);
        const errorMessage = error instanceof z.ZodError 
            ? error.errors.map(e => e.message).join(', ') 
            : 'An unexpected error occurred.';
        return { success: false, error: errorMessage };
    }
}
