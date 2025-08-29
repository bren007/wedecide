
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-review-questions.ts';
import '@/ai/flows/generate-assessment.ts';
import '@/ai/flows/generate-strategic-questions.ts';
import '@/ai/flows/generate-meeting-summary.ts';
import '@/ai/flows/summarize-transcript.ts';
