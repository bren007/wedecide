
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

export const AnalyzeDecisionDocumentInputSchema = z.object({
  documentContent: z.string().describe('The full text content of the decision document to be analyzed.'),
});
export type AnalyzeDecisionDocumentInput = z.infer<typeof AnalyzeDecisionDocumentInputSchema>;

export const AnalyzeDecisionDocumentOutputSchema = z.object({
  documentType: z.string().describe("The identified type of the document (e.g., 'Business Case', 'Policy Paper', 'Report', 'Meeting Minutes')."),
  extractedTitle: z.string().describe('A suitable and concise title for the proposal, extracted or generated from the document.'),
  extractedDecisionSought: z.string().describe('The primary decision being sought, as identified in the document.'),
  extractedBackground: z.string().describe('A comprehensive summary of the document to serve as the decision background.'),
  preVettingAssessment: z.array(z.string()).describe('A list of initial feedback points or questions for the submitter to help improve the proposal before formal submission, based on the identified document type.'),
});
export type AnalyzeDecisionDocumentOutput = z.infer<typeof AnalyzeDecisionDocumentOutputSchema>;


export async function analyzeDecisionDocument(input: AnalyzeDecisionDocumentInput): Promise<AnalyzeDecisionDocumentOutput> {
  return analyzeDecisionDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDecisionDocumentPrompt',
  input: {schema: AnalyzeDecisionDocumentInputSchema},
  output: {schema: AnalyzeDecisionDocumentOutputSchema},
  prompt: `You are an expert secretariat member responsible for helping colleagues prepare high-quality decision papers. You have been given the text from a document. Your task is to analyze it and prepare it for formal submission into a decision intelligence system.

Perform the following steps:

1.  **Identify Document Type:** First, determine the type of document provided. Is it a Business Case, a Policy Paper, a Status Report, a formal proposal, or something else?

2.  **Extract Key Information:**
    *   **Title:** Generate a concise, clear title for the proposal based on the document's content.
    *   **Decision Sought:** Identify and extract the single, primary decision being sought. If there are multiple, identify the most important one. State it clearly and actionably.
    *   **Background:** Write a comprehensive summary of the document's key points, context, and justification. This will serve as the background for the decision.

3.  **Conduct Pre-Vetting Assessment:** Based on the identified document type, provide a list of critical but constructive questions or feedback points for the submitter. This should help them improve the document *before* they formally submit it.
    *   If it's a **Business Case**, your feedback should focus on financials, ROI, risk analysis, and options considered. (e.g., "Is the cost-benefit analysis robust?", "Are the key risks and mitigation strategies clearly outlined?")
    *   If it's a **Policy Paper**, your feedback should focus on stakeholder impact, implementation plan, and alignment with existing policy. (e.g., "Who are the key stakeholders, and how have they been consulted?", "Is there a clear plan for implementation?")
    *   If it's a **Report**, your feedback might question the clarity of its recommendations or the data supporting its findings. (e.g., "Are the recommendations clearly actionable?", "Is the data used to support the findings clearly cited?")

**Document Content to Analyze:**
{{{documentContent}}}
`,
});

const analyzeDecisionDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDecisionDocumentFlow',
    inputSchema: AnalyzeDecisionDocumentInputSchema,
    outputSchema: AnalyzeDecisionDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
