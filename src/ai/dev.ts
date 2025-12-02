'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/code-syntax-highlighting.ts';
import '@/ai/flows/ai-assistant-flow.ts';
