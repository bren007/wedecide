
'use server';

/**
 * @fileOverview AI agent that generates a scaffold for a decision document.
 *
 * - generateDocumentScaffold - A function that generates the document scaffold.
 * - GenerateDocumentScaffoldInput - The input type for the function.
 * - GenerateDocumentScaffoldOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDocumentScaffoldInputSchema = z.object({
  proposalTitle: z.string().describe('The working title for the proposal.'),
  documentType: z.enum(['Business Case', 'Policy Paper', 'Project Proposal', 'Report']).describe('The type of document to be generated.'),
  coreIdea: z.string().describe('A brief, one or two-sentence description of the core idea or problem to be addressed.'),
});
export type GenerateDocumentScaffoldInput = z.infer<typeof GenerateDocumentScaffoldInputSchema>;

const GenerateDocumentScaffoldOutputSchema = z.object({
  draftDocument: z.string().describe('The generated draft document content in Markdown format.'),
});
export type GenerateDocumentScaffoldOutput = z.infer<typeof GenerateDocumentScaffoldOutputSchema>;

export async function generateDocumentScaffold(input: GenerateDocumentScaffoldInput): Promise<GenerateDocumentScaffoldOutput> {
  return generateDocumentScaffoldFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDocumentScaffoldPrompt',
  input: {schema: GenerateDocumentScaffoldInputSchema},
  output: {schema: GenerateDocumentScaffoldOutputSchema},
  prompt: `You are an expert public sector advisor, skilled at creating clear, structured, and effective official documents. Your task is to generate a draft document scaffold based on the user's request.

The user wants to create a '{{{documentType}}}' for a proposal titled '{{{proposalTitle}}}'.
The core idea is: "{{{coreIdea}}}"

Based on the document type, generate a comprehensive draft. Use Markdown for formatting, including headings, subheadings, and bullet points. The content should be high-quality boilerplate that provides a strong starting point for the user.

**DOCUMENT TYPE SPECIFIC INSTRUCTIONS:**

*   If the **documentType** is a **'Business Case'**:
    *   Structure the document according to a standard government business case format (e.g., similar to the "Better Business Case" model).
    *   Include sections like:
        1.  **Executive Summary:** A concise overview of the problem, proposed solution, and recommendation.
        2.  **Strategic Context:** How the proposal aligns with organizational goals.
        3.  **Problem Statement:** A detailed description of the problem or opportunity.
        4.  **Options Analysis:** A description of at least three options (including a 'do nothing' option).
        5.  **Recommended Option:** Justification for the preferred option.
        6.  **Implementation Plan:** High-level timeline and milestones.
        7.  **Financial Analysis:** Placeholder for costs, benefits, and funding sources.
        8.  **Risk Assessment:** Initial thoughts on potential risks.
    *   Incorporate the user's 'coreIdea' into the relevant sections.

*   If the **documentType** is a **'Policy Paper'**:
    *   Structure the document to be persuasive and evidence-based.
    *   Include sections like:
        1.  **Introduction:** Define the policy issue and the purpose of the paper.
        2.  **Background:** Provide context and history of the issue.
        3.  **Stakeholder Analysis:** Identify key stakeholders and their positions.
        4.  **Policy Options:** Analyze 2-3 potential policy options, including pros and cons for each.
        5.  **Recommendation:** State the recommended policy and provide a strong justification.
        6.  **Implementation Considerations:** Discuss potential challenges and next steps.

*   For any other document type, use a logical structure appropriate for that type.

Now, generate the draft document.
`,
});

const generateDocumentScaffoldFlow = ai.defineFlow(
  {
    name: 'generateDocumentScaffoldFlow',
    inputSchema: GenerateDocumentScaffoldInputSchema,
    outputSchema: GenerateDocumentScaffoldOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
