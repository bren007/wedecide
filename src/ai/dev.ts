'use server';
import { config } from 'dotenv';
config();

// New agentic flows for the MVP
import '@/ai/flows/generate-initial-brief';
import '@/ai/flows/refine-brief';

// TODO: The flows below are from the old prototype and should be removed or adapted.
// For now, we will leave them to avoid breaking imports, but they are not used in the new agentic workflow.
import '@/ai/flows/generate-review-questions.ts';
import '@/ai/flows/generate-assessment.ts';
import '@/ai/flows/generate-strategic-questions.ts';
import '@/ai/flows/generate-meeting-summary.ts';
import '@/ai/flows/summarize-transcript.ts';
import '@/ai/flows/analyze-decision-document.ts';
import '@/ai/flows/generate-document-scaffold.ts';
