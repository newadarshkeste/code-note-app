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

const SubmissionResultSchema = z.object({
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
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

    const decodedStdout = jsonResult.stdout ? Buffer.from(jsonResult.stdout, 'base64').toString('utf-8') : null;
    const decodedStderr = jsonResult.stderr ? Buffer.from(jsonResult.stderr, 'base64').toString('utf-8') : null;

    const finalResult = {
      stdout: decodedStdout,
      stderr: decodedStderr,
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
    
    console.log("SUBMITTED languageId:", languageId);
    console.log("SUBMITTED base64:", submissionBody.source_code);

    const token = await createSubmission(submissionBody);

    while (true) {
        const result = await getResult(token);
        if (result.status.id > 2) {
            return result;
        }
        await wait(1000);
    }
}
