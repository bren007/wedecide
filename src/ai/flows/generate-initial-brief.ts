'use server';
/**
 * @fileOverview A Genkit flow for generating the initial decision brief.
 *
 * - generateInitialBrief - A function that handles the brief generation process.
 * - GenerateInitialBriefInput - The input type for the generateInitialBrief function.
 * - GenerateInitialBriefOutput - The return type for the generateInitialBrief function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  getMockDatabaseData,
  getMockPublicAPIData,
  getMockSpreadsheetData,
  strategicGoals
} from '@/lib/data';

const GenerateInitialBriefInputSchema = z.object({
  goal: z.string().describe('The user\'s initial goal or problem statement.'),
});
export type GenerateInitialBriefInput = z.infer<typeof GenerateInitialBriefInputSchema>;

const GenerateInitialBriefOutputSchema = z.object({
  brief: z.object({
    goal: z.string(),
    title: z.string().describe("A clear, concise title for the decision brief."),
    strategicCase: z.string().describe("The initial strategic case for the decision, explaining why it's important."),
    optionsAnalysis: z.string().describe("A high-level analysis of potential options. This will be brief initially."),
    recommendation: z.string().describe("The agent's initial recommendation. This will be brief initially."),
    financialCase: z.string().describe("A placeholder or high-level summary of the financial implications, to be detailed later."),
    alignmentScore: z.number().describe("A score from 0 to 100 indicating how well the proposal aligns with strategic goals."),
    alignmentRationale: z.string().describe("A brief explanation for the alignment score, referencing specific strategic goals."),
  }),
  agentQuestions: z.array(z.string()).describe("A list of 3-5 clarifying questions for the user to help refine the brief in the next step."),
});
export type GenerateInitialBriefOutput = z.infer<typeof GenerateInitialBriefOutputSchema>;

// This is the main exported function that will be called by the server action.
export async function generateInitialBrief(input: GenerateInitialBriefInput): Promise<GenerateInitialBriefOutput> {
    const result = await generateInitialBriefFlow(input);
    // Ensure the original goal is passed through.
    result.brief.goal = input.goal;
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
    inputSchema: z.object({}),
    outputSchema: SpreadsheetDataSchema,
  },
  async () => {
    console.log('AGENT: Calling getSpreadsheetDataTool');
    return await getMockSpreadsheetData();
  }
);

const getDatabaseDataTool = ai.defineTool(
  {
    name: 'getDatabaseData',
    description: 'Retrieves project details from an internal database.',
    inputSchema: z.object({}),
    outputSchema: DatabaseDataSchema,
  },
  async () => {
    console.log('AGENT: Calling getDatabaseDataTool');
    return await getMockDatabaseData();
  }
);

const getPublicAPIDataTool = ai.defineTool(
  {
    name: 'getPublicAPIData',
    description: 'Retrieves public demographic and economic data from an external API.',
    inputSchema: z.object({}),
    outputSchema: PublicAPIDataSchema,
  },
  async () => {
    console.log('AGENT: Calling getPublicAPIDataTool');
    return await getMockPublicAPIData();
  }
);


// Define the main prompt for the agent.
const generateBriefPrompt = ai.definePrompt({
  name: 'generateInitialBriefPrompt',
  input: { schema: GenerateInitialBriefInputSchema },
  output: { schema: GenerateInitialBriefOutputSchema },
  tools: [getSpreadsheetDataTool, getDatabaseDataTool, getPublicAPIDataTool],
  prompt: `You are an expert public sector advisor, skilled at drafting high-impact decision briefs. Your task is to take a user's initial goal and transform it into a structured, initial decision brief.

**User's Goal:** "{{goal}}"

**Your Process:**

1.  **Analyze the Goal & Available Data:**
    *   Review the user's goal.
    *   You have access to tools to pull data from spreadsheets, databases, and public APIs. Use them to gather initial context (e.g., financial data, project status, regional stats).
    *   Synthesize this information to form a preliminary understanding of the situation.

2.  **Draft the Initial Brief:**
    *   **Title:** Create a clear, action-oriented title.
    *   **Strategic Case:** Write a compelling paragraph explaining why this goal is important and what problem it solves.
    *   **Options, Recommendation, Financials:** Briefly outline these sections. You don't have all the details yet, so keep them high-level. Acknowledge that they are preliminary.
    *   **Strategic Alignment:** Compare the user's goal against the provided list of strategic organizational goals. Determine the most relevant goal, calculate an alignment score (0-100), and write a brief rationale for your assessment.

3.  **Ask Clarifying Questions:**
    *   You are smart, but you are not a mind reader. Your initial draft is based on limited information.
    *   To improve the brief, you must ask the user for more information.
    *   Generate a list of 3-5 specific, insightful questions that will help you flesh out the 'Strategic Case', 'Options Analysis', and other key sections in the next iteration.
    *   Focus your questions on understanding the nuances, risks, stakeholders, and desired outcomes. Avoid simple yes/no questions.
    *   **Important**: For the 'agentQuestions' field, return only the array of questions.

**Available Strategic Goals for Alignment:**
{{#each strategicGoals}}
- **{{name}}**: {{description}}
{{/each}}
`,
});

// Define the Genkit flow.
const generateInitialBriefFlow = ai.defineFlow(
  {
    name: 'generateInitialBriefFlow',
    inputSchema: GenerateInitialBriefInputSchema,
    outputSchema: GenerateInitialBriefOutputSchema,
  },
  async (input) => {
    console.log('AGENT: Starting generateInitialBriefFlow with goal:', input.goal);

    // We need to provide the strategic goals to the prompt context.
    const promptInput = {
      ...input,
      strategicGoals,
    };

    const { output } = await generateBriefPrompt(promptInput);

    if (!output) {
      throw new Error('The agent failed to generate a brief.');
    }
    
    console.log('AGENT: Successfully generated initial brief and questions.');
    return output;
  }
);
