'use server';

import { codeSyntaxHighlighting } from '@/ai/flows/code-syntax-highlighting';
import { z } from 'zod';

const inputSchema = z.string().min(1, { message: 'Code cannot be empty' });

export async function getHighlightedCode(code: string) {
  try {
    const validatedCode = inputSchema.parse(code);
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
