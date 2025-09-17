
'use server';

/**
 * @fileOverview AI agent that analyzes a decision document to extract key information and provide a pre-vetting assessment.
 *
 * - analyzeDecisionDocument - A function that analyzes the document.
 * - AnalyzeDecisionDocumentInput - The input type for the analyzeDecisionDocument function.
 * - AnalyzeDecisionDocumentOutput - The return type for the analyzeDecisionDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDecisionDocumentInputSchema = z.object({
  documentContent: z.string().describe('The full text content of the decision document to be analyzed.'),
});
export type AnalyzeDecisionDocumentInput = z.infer<typeof AnalyzeDecisionDocumentInputSchema>;

const AnalyzeDecisionDocumentOutputSchema = z.object({
  documentType: z.string().describe("The identified type of the document (e.g., 'Business Case', 'Policy Paper', 'Report', 'Meeting Minutes')."),
  suggestedTitle: z.string().describe('A suitable and concise title for the proposal, generated from the document.'),
  suggestedDecisionSought: z.string().describe('A revised, clearer version of the "Decision Sought" statement based on the document.'),
  suggestedBackground: z.string().describe('A revised, more comprehensive version of the "Background" section based on the document.'),
  preVettingAssessment: z.array(z.string()).describe('A list of initial feedback points or questions for the submitter to help improve the proposal before formal submission, based on the identified document type.'),
});
export type AnalyzeDecisionDocumentOutput = z.infer<typeof AnalyzeDecisionDocumentOutputSchema>;


export async function analyzeDecisionDocument(input: AnalyzeDecisionDocumentInput): Promise<AnalyzeDecisionDocumentOutput> {
  const analyzeDecisionDocumentFlow = ai.defineFlow(
    {
      name: 'analyzeDecisionDocumentFlow',
      inputSchema: AnalyzeDecisionDocumentInputSchema,
      outputSchema: AnalyzeDecisionDocumentOutputSchema,
    },
    async input => {
      const prompt = ai.definePrompt({
          name: 'analyzeDecisionDocumentPrompt',
          input: {schema: AnalyzeDecisionDocumentInputSchema},
          output: {schema: AnalyzeDecisionDocumentOutputSchema},
          prompt: `You are an expert secretariat member, skilled at refining decision proposals to make them clearer, more concise, and more impactful for senior decision-makers. You have been given the text from a document. Your task is to analyze it and prepare it for formal submission into a decision intelligence system.

Perform the following steps:

1.  **Identify Document Type:** First, determine the type of document provided. Is it a Business Case, a Policy Paper, a Status Report, a formal proposal, or something else?

2.  **Generate Improved Content:** Rewrite and improve the key sections of the proposal.
    *   **Suggested Title:** Generate a concise, clear title for the proposal based on the document's content.
    *   **Suggested Decision Sought:** Rewrite the 'Decision Sought' to be a single, unambiguous, and actionable request. Incorporate specific details from the background to make it self-contained.
    *   **Suggested Background:** Rewrite the background as a compelling narrative for a time-poor executive. Start with the core problem, explain the solution, and clarify why this decision is important now.

3.  **Conduct Pre-Vetting Assessment:** Based on the identified document type, provide a list of critical but constructive questions or feedback points for the submitter. This should help them improve the document *before* they formally submit it.
    *   If it's a **Business Case**, your feedback should focus on financials, ROI, risk analysis, and options considered.
    *   If it's a **Policy Paper**, your feedback should focus on stakeholder impact, implementation plan, and alignment with existing policy.
    *   If it's a **Report**, your feedback might question the clarity of its recommendations or the data supporting its findings.

**Document Content to Analyze:**
{{{documentContent}}}
`,
        });

      const {output} = await prompt(input);
      return output!;
    }
  );
  
  return analyzeDecisionDocumentFlow(input);
}
