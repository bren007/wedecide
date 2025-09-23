
'use server';
/**
 * @fileOverview A Genkit flow for refining a decision brief based on user feedback.
 *
 * - refineBrief - A function that handles the brief refinement process.
 * - RefineBriefInput - The input type for the refineBrief function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {DecisionBrief, BriefVersion} from '@/lib/types';
import {
  getMockDatabaseData,
  getMockPublicAPIData,
  getMockSpreadsheetData,
} from '@/lib/data';

const RefineBriefInputSchema = z.object({
  existingBrief: z.any().describe('The current state of the decision brief as a JSON object.'),
  userResponses: z.record(z.string()).describe("The user's answers to the agent's clarification questions."),
});
export type RefineBriefInput = z.infer<typeof RefineBriefInputSchema>;


// This is the main exported function that will be called by the server action.
export async function refineBrief(input: RefineBriefInput): Promise<DecisionBriefContent> {
  const result = await refineBriefFlow(input);
  return result;
}

// Define the Zod schema for the tools' output.
const SpreadsheetDataSchema = z.object({
  financials: z.object({
    year: z.number(),
    budget: z.number(),
    spend: z.number(),
  }),
  kpis: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      trend: z.string(),
    })
  ),
});

const DatabaseDataSchema = z.object({
    project: z.object({
        id: z.string(),
        name: z.string(),
        status: z.string(),
        manager: z.string(),
    })
});

const PublicAPIDataSchema = z.object({
    region: z.object({
        name: z.string(),
        population: z.number(),
        gdp_per_capita: z.number(),
    })
});


// Define the tools that the agent can use to gather information.
const getSpreadsheetDataTool = ai.defineTool(
  {
    name: 'getSpreadsheetData',
    description: 'Retrieves financial and KPI data from a spreadsheet for the specified project.',
    inputSchema: z.undefined(),
    outputSchema: SpreadsheetDataSchema,
  },
  async () => {
    console.log('AGENT (refine): Calling getSpreadsheetDataTool');
    return await getMockSpreadsheetData();
  }
);

const getDatabaseDataTool = ai.defineTool(
  {
    name: 'getDatabaseData',
    description: 'Retrieves project details from an internal database.',
    inputSchema: z.undefined(),
    outputSchema: DatabaseDataSchema,
  },
  async () => {
    console.log('AGENT (refine): Calling getDatabaseDataTool');
    return await getMockDatabaseData();
  }
);

const getPublicAPIDataTool = ai.defineTool(
  {
    name: 'getPublicAPIData',
    description: 'Retrieves public demographic and economic data from an external API.',
    inputSchema: z.undefined(),
    outputSchema: PublicAPIDataSchema,
  },
  async () => {
    console.log('AGENT (refine): Calling getPublicAPIDataTool');
    return await getMockPublicAPIData();
  }
);


const DecisionBriefContentSchema = z.object({
  goal: z.string().describe("The original user goal. This should not be changed."),
  title: z.string().describe("A clear, concise title for the decision brief."),
  strategicCase: z.string().describe("The strategic case for the decision. This should be refined and expanded based on the user's answers and any new information gathered by the tools."),
  optionsAnalysis: z.string().describe("An analysis of the different options available, including a summary of pros and cons for each."),
  recommendation: z.string().describe("The agent's recommended course of action."),
  financialCase: z.string().describe("A summary of the financial implications, including budget impact and potential return on investment. This should be generated using data from the available tools."),
  alignmentScore: z.number().describe("A score from 0 to 100 indicating how well the proposal aligns with strategic goals."),
  alignmentRationale: z.string().describe("A brief explanation for the alignment score, referencing specific strategic goals."),
});
type DecisionBriefContent = z.infer<typeof DecisionBriefContentSchema>;


// Define the main prompt for the agent.
const refineBriefPrompt = ai.definePrompt({
  name: 'refineBriefPrompt',
  input: { schema: RefineBriefInputSchema },
  output: { schema: DecisionBriefContentSchema },
  tools: [getSpreadsheetDataTool, getDatabaseDataTool, getPublicAPIDataTool],
  prompt: `You are an expert public sector advisor. Your task is to refine a decision brief based on clarifying answers provided by the user.

You have the original brief and the user's responses to your previous questions.
Your goal is to produce a more detailed, evidence-based, and robust version of the brief.

1.  **Incorporate User Feedback:** Carefully review the user's answers and integrate them into the 'Strategic Case' and other relevant sections. The user's input is the primary source of truth for the strategic narrative.
2.  **Use Your Tools:** You have access to tools to gather financial, project, and public data. You MUST use these tools to generate the 'Financial Case' and enrich the 'Options Analysis' and 'Recommendation' sections.
3.  **Re-evaluate and Refine:** Update all sections of the brief with the new information. Ensure the options analysis is thorough and the recommendation is well-justified.
4.  **Do Not Ask More Questions:** Your task is to provide a refined brief, not to continue the conversation. Do not generate new clarification questions.

**Original Brief:**
\`\`\`json
{{{JSONstringify existingBrief}}}
\`\`\`

**User's Answers:**
{{#each userResponses}}
- **Question:** "{{@key}}"
- **Answer:** "{{this}}"
{{/each}}
`,
});

// Define the Genkit flow.
const refineBriefFlow = ai.defineFlow(
  {
    name: 'refineBriefFlow',
    inputSchema: RefineBriefInputSchema,
    outputSchema: DecisionBriefContentSchema,
  },
  async (input) => {
    console.log('AGENT: Starting refineBriefFlow with input:', input);
    
    const promptInput = {
      ...input,
      JSONstringify: (obj: any) => JSON.stringify(obj, null, 2),
    };

    const { output } = await refineBriefPrompt(promptInput);
    
    if (!output) {
      console.error('AGENT: The refineBriefPrompt returned no output.');
      throw new Error('The agent failed to generate a refined brief.');
    }
    
    console.log('AGENT: Successfully generated refined brief.');
    return output;
  }
);
