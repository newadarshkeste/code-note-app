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

// This schema defines the full submission object returned by Judge0,
// including all possible fields we might get back.
const SubmissionResultSchema = z.object({
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  status: z.object({
    id: z.number(),
    description: z.string(),
  }),
  source_code: z.string().optional(),
  language_id: z.number().optional(),
  // Add other fields from Judge0 response if needed
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
    const response = await fetch(`https://${API_HOST}/submissions/${token}?base64_encoded=true`, {
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

    // Judge0 sends back base64 encoded strings for stdout and stderr. We need to decode them.
    // The previous implementation was flawed and was not correctly assigning the decoded values.
    const decodedResult = { ...jsonResult };
    if (decodedResult.stdout) {
      decodedResult.stdout = Buffer.from(decodedResult.stdout, 'base64').toString('utf-8');
    }
    if (decodedResult.stderr) {
      decodedResult.stderr = Buffer.from(decodedResult.stderr, 'base64').toString('utf-8');
    }

    return SubmissionResultSchema.parse(decodedResult);
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

    while (true) {
        const result = await getResult(token);
        // Status ID > 2 means the code has finished processing (e.g., accepted, wrong answer, runtime error)
        if (result.status.id > 2) {
            return result;
        }
        await wait(1000); // Poll every 1 second
    }
}
