
'use server';
import { config } from 'dotenv';
config();

// This is a workaround to prevent Genkit from re-registering flows on hot reloads.
// In a production environment, this file would not be used.
const devFileLoaded = 'devFileLoaded';
if (!(global as any)[devFileLoaded]) {
  (global as any)[devFileLoaded] = true;

  // New agentic flows for the MVP
  import ('@/ai/flows/generate-initial-brief');
  import ('@/ai/flows/refine-brief');

  // TODO: The flows below are from the old prototype and should be removed or adapted.
  // For now, we will leave them to avoid breaking imports, but they are not used in the new agentic workflow.
  import ('@/ai/flows/generate-review-questions');
  import ('@/ai/flows/generate-assessment');
  import ('@/ai/flows/generate-strategic-questions');
  import ('@/ai/flows/generate-meeting-summary');
  import ('@/ai/flows/summarize-transcript');
  import ('@/ai/flows/analyze-decision-document');
  import ('@/ai/flows/generate-document-scaffold');
}
