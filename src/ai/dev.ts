'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-review-questions.ts';
import '@/ai/flows/summarize-proposal.ts';
import '@/ai/flows/generate-strategic-questions.ts';
import '@/ai/flows/generate-meeting-summary.ts';
