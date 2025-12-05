
'use server';

import { z } from 'zod';

const SubmissionRequestSchema = z.object({
  source_code: z.string(),
  language_id: z.number(),
  stdin: z.string().optional(),
});
type SubmissionRequest = z.infer<typeof SubmissionRequestSchema>;

const SubmissionResponseSchema = z.object({
  token: z.string(),
});

// This schema now allows all fields to be nullable, which is the key fix.
// Judge0 returns null for fields like stdout when there is a compilation error.
const SubmissionResultSchema = z.object({
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  compile_output: z.string().nullable(),
  message: z.string().nullable(),
  status: z.object({
    id: z.number(),
    description: z.string(),
  }),
});
export type Judge0Result = z.infer<typeof SubmissionResultSchema>;

const API_HOST = 'judge0-ce.p.rapidapi.com';
const API_KEY = process.env.REACT_APP_JUDGE0_KEY || '';

if (!API_KEY) {
  console.warn("Judge0 API key not found. Please set REACT_APP_JUDGE0_KEY in your .env file.");
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function createSubmission(body: SubmissionRequest): Promise<string> {
  const response = await fetch(`https://${API_HOST}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Host': API_HOST,
      'X-RapidAPI-Key': API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 API error (createSubmission): ${response.status} ${errorText}`);
  }

  const result = SubmissionResponseSchema.parse(await response.json());
  return result.token;
}

async function getResult(token: string): Promise<Judge0Result> {
    const response = await fetch(`https://${API_HOST}/submissions/${token}?base64_encoded=true&fields=*`, {
        method: 'GET',
        headers: {
            'X-RapidAPI-Host': API_HOST,
            'X-RapidAPI-Key': API_KEY,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 API error (getResult): ${response.status} ${errorText}`);
    }
    
    const jsonResult = await response.json();

    // The key fix is here: decode all relevant fields, even on error.
    const decodedStdout = jsonResult.stdout ? Buffer.from(jsonResult.stdout, 'base64').toString('utf-8') : null;
    const decodedStderr = jsonResult.stderr ? Buffer.from(jsonResult.stderr, 'base64').toString('utf-8') : null;
    const decodedCompileOutput = jsonResult.compile_output ? Buffer.from(jsonResult.compile_output, 'base64').toString('utf-8') : null;
    const decodedMessage = jsonResult.message ? Buffer.from(jsonResult.message, 'base64').toString('utf-8') : null;

    // Use compile_output or stderr as the primary source of error.
    const finalStderr = decodedCompileOutput || decodedStderr;

    const finalResult = {
      stdout: decodedStdout,
      stderr: finalStderr,
      compile_output: decodedCompileOutput,
      message: decodedMessage,
      status: jsonResult.status,
    };
    
    return SubmissionResultSchema.parse(finalResult);
}


export async function runCode(languageId: number, code: string, input?: string): Promise<Judge0Result> {
    if (!API_KEY) {
        throw new Error("Judge0 API key is not configured.");
    }
    
    const submissionBody: SubmissionRequest = {
        language_id: languageId,
        source_code: Buffer.from(code).toString('base64'),
        stdin: input ? Buffer.from(input).toString('base64') : undefined,
    };

    const token = await createSubmission(submissionBody);

    let attempts = 0;
    const maxAttempts = 10; // Wait for a maximum of 10 seconds.

    while (attempts < maxAttempts) {
        const result = await getResult(token);
        // Status ID > 2 means processing is finished (e.g., Accepted, Wrong Answer, Compilation Error, etc.)
        if (result.status.id > 2) { 
            return result;
        }
        attempts++;
        await wait(1000);
    }

    // If the loop finishes, something went wrong, return the last known status.
    return await getResult(token);
}
