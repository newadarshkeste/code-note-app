'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-assistant-flow.ts';
import '@/ai/flows/quiz-generator-flow.ts';
