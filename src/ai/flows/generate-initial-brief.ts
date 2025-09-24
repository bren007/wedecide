'use server';
/**
 * @fileOverview A Genkit flow for the initial discovery stage of creating a decision brief.
 * This flow identifies data sources and generates clarification questions for the user.
 *
 * - generateInitialBrief - A function that handles the discovery process.
 * - GenerateInitialBriefInput - The input type for the function.
 * - GenerateInitialBriefOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialBriefInputSchema = z.object({
  goal: z.string().describe('The user\'s initial goal or problem statement.'),
});
export type GenerateInitialBriefInput = z.infer<typeof GenerateInitialBriefInputSchema>;

const GenerateInitialBriefOutputSchema = z.object({
  identifiedSources: z.array(z.string()).describe('A list of potential data sources the agent has identified as relevant to the user\'s goal.'),
  agentQuestions: z.array(z.object({
    question: z.string().describe("A specific, insightful question for the user."),
    rationale: z.string().describe("A brief explanation of why this question is being asked and what information it will help clarify.")
  })).describe("A list of 2-3 focused clarifying questions for the user to help confirm intent and fill gaps."),
});
export type GenerateInitialBriefOutput = z.infer<typeof GenerateInitialBriefOutputSchema>;

// This is the main exported function that will be called by the server action.
export async function generateInitialBrief(input: GenerateInitialBriefInput): Promise<GenerateInitialBriefOutput> {
    const result = await generateInitialBriefFlow(input);
    return result;
}

// Define the tools that the agent can use to gather information.
const getSpreadsheetDataTool = ai.defineTool(
  {
    name: 'getSpreadsheetData',
    description: 'A tool to access financial and KPI data from spreadsheets. Use this to find budget, spend, or performance metrics.',
  },
  async () => {}
);

const getDatabaseDataTool = ai.defineTool(
  {
    name: 'getDatabaseData',
    description: 'A tool to access project details from internal databases. Use this to find project status, managers, or timelines.',
  },
  async () => {}
);

const getPublicAPIDataTool = ai.defineTool(
  {
    name: 'getPublicAPIData',
    description: 'A tool to access public demographic and economic data from external APIs. Use this for regional statistics.',
  },
  async () => {}
);


// Define the main prompt for the agent.
const generateBriefPrompt = ai.definePrompt({
  name: 'generateInitialBriefPrompt',
  input: { schema: GenerateInitialBriefInputSchema },
  output: { schema: GenerateInitialBriefOutputSchema },
  tools: [getSpreadsheetDataTool, getDatabaseDataTool, getPublicAPIDataTool],
  prompt: `You are an expert public sector advisor kicking off a discovery process for a new decision brief.

**User's Goal:** "{{goal}}"

**Your Task:**

1.  **Identify Data Sources:** Based on the user's goal, identify which of your available tools could provide relevant data. Do NOT call the tools yet. Simply list the names of the tools you plan to use (e.g., "getSpreadsheetData").
2.  **Ask Clarifying Questions:** Generate 2-3 focused questions for the user. These questions should help you clarify their intent, understand the scope, and identify key success metrics. For each question, provide a clear rationale.
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
    console.log('AGENT: Starting generateInitialBriefFlow (Discovery Stage) with goal:', input.goal);

    const { output } = await generateBriefPrompt(input);

    if (!output) {
      console.error('AGENT: The generateBriefPrompt returned no output for discovery.');
      throw new Error('The agent failed to generate discovery questions.');
    }
    
    // The prompt now has access to tools, and we can inspect which tools it decided to use.
    // For this stage, we just want to list the tools, not execute them.
    // The `history` contains the sequence of LLM calls and tool requests.
    // We can extract the tool names from the `toolRequest` parts.
    // Note: This part is conceptual for this prompt. A more advanced implementation
    // would inspect the tool calls the LLM *would* make.
    // For now, we will simulate this by adding a placeholder.
    const identifiedSources = ['Q1_Budget.xlsx', 'public_transport_api', 'internal_project_db'];

    const finalOutput: GenerateInitialBriefOutput = {
      identifiedSources: identifiedSources,
      agentQuestions: output.agentQuestions,
    };
    
    console.log('AGENT: Successfully completed discovery stage.');
    return finalOutput;
  }
);
