
'use server';
/**
 * @fileOverview A Genkit flow for generating the main document artifact and its summary brief.
 * This flow is triggered after the user answers the initial clarification questions.
 *
 * - generateDraftAndSummarize - A function that handles the document generation.
 * - GenerateDraftInput - The input type for the function.
 * - GenerateDraftOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  getMockDatabaseData,
  getMockPublicAPIData,
  getMockSpreadsheetData,
  strategicGoals,
} from '@/lib/data';

const GenerateDraftInputSchema = z.object({
  goal: z.string().describe("The user's original goal."),
  userResponses: z.record(z.string()).describe("The user's answers to the agent's clarification questions."),
});
export type GenerateDraftInput = z.infer<typeof GenerateDraftInputSchema>;

const BriefContentSchema = z.object({
  title: z.string().describe("A clear, concise title for the decision brief."),
  strategicCase: z.string().describe("A summary of the strategic case for the decision, explaining why it's important."),
  recommendation: z.string().describe("The agent's recommended course of action."),
  alignmentScore: z.number().describe("A score from 0 to 100 indicating how well the proposal aligns with strategic goals."),
  alignmentRationale: z.string().describe("A brief explanation for the alignment score, referencing specific strategic goals."),
});

const FullArtifactContentSchema = z.object({
  title: z.string().describe("A clear, concise, and official title for the full decision artifact."),
  strategicCase: z.string().describe("The full strategic case for the decision, explaining in detail why it's important, the problem it solves, and how it aligns with organizational goals. This should be comprehensive."),
  optionsAnalysis: z.string().describe("A detailed analysis of the different options available, including a 'do nothing' option, with a summary of pros and cons for each."),
  recommendation: z.string().describe("The agent's fully justified recommended course of action, explaining why it was chosen over other options."),
  financialCase: z.string().describe("A detailed summary of the financial implications, including budget impact and potential return on investment, based on the data retrieved from tools."),
});

const GenerateDraftOutputSchema = z.object({
  brief: BriefContentSchema.describe('The concise summary layer of the document.'),
  fullArtifact: FullArtifactContentSchema.describe('The comprehensive, detailed layer of the document.'),
});
export type GenerateDraftOutput = z.infer<typeof GenerateDraftOutputSchema>;

// This is the main exported function that will be called by the server action.
export async function generateDraftAndSummarize(input: GenerateDraftInput): Promise<GenerateDraftOutput> {
  return generateDraftAndSummarizeFlow(input);
}

// Define the Zod schema for the tools' output.
const SpreadsheetDataSchema = z.object({
  financials: z.object({ year: z.number(), budget: z.number(), spend: z.number() }),
  kpis: z.array(z.object({ name: z.string(), value: z.string(), trend: z.string() })),
});

const DatabaseDataSchema = z.object({
    project: z.object({ id: z.string(), name: z.string(), status: z.string(), manager: z.string() })
});

const PublicAPIDataSchema = z.object({
    region: z.object({ name: z.string(), population: z.number(), gdp_per_capita: z.number() })
});

// Define the tools that the agent can use to gather information.
const getSpreadsheetDataTool = ai.defineTool({
    name: 'getSpreadsheetData',
    description: 'Retrieves financial and KPI data from a spreadsheet.',
    inputSchema: z.undefined(),
    outputSchema: SpreadsheetDataSchema,
  }, async () => await getMockSpreadsheetData());

const getDatabaseDataTool = ai.defineTool({
    name: 'getDatabaseData',
    description: 'Retrieves project details from an internal database.',
    inputSchema: z.undefined(),
    outputSchema: DatabaseDataSchema,
  }, async () => await getMockDatabaseData());

const getPublicAPIDataTool = ai.defineTool({
    name: 'getPublicAPIData',
    description: 'Retrieves public demographic and economic data from an external API.',
    inputSchema: z.undefined(),
    outputSchema: PublicAPIDataSchema,
  }, async () => await getMockPublicAPIData());


// Define the main prompt for the agent.
const generateDraftPrompt = ai.definePrompt({
  name: 'generateDraftPrompt',
  input: { schema: GenerateDraftInputSchema.extend({ strategicGoals: z.any() }) },
  output: { schema: GenerateDraftOutputSchema },
  tools: [getSpreadsheetDataTool, getDatabaseDataTool, getPublicAPIDataTool],
  prompt: `You are an expert public sector advisor. Your task is to write a comprehensive decision artifact and a concise summary brief based on a user's goal and their answers to your clarifying questions.

**User's Goal:** "{{goal}}"

**User's Answers:**
{{#each userResponses}}
- **Question:** "{{@key}}"
- **Answer:** "{{this}}"
{{/each}}

**Your Process:**

1.  **Use Your Tools:** You MUST use your tools to gather financial, project, and public data to create a detailed, evidence-based artifact.
2.  **Generate the Full Artifact:** Create the comprehensive 'fullArtifact' document. It must be detailed and structured with the following sections: Title, Strategic Case, Options Analysis, Recommendation, and Financial Case.
3.  **Generate the Brief:** After creating the full artifact, create the 'brief' document. The brief MUST be a concise summary of the full artifact. It should contain: Title, Strategic Case (summarized), Recommendation (summarized), and the Strategic Alignment Score/Rationale.
4.  **Strategic Alignment:** For both documents, compare the user's goal against the provided list of strategic organizational goals to determine the most relevant one, calculate an alignment score (0-100), and provide a rationale.

**Available Strategic Goals for Alignment:**
{{#each strategicGoals}}
- **{{name}}**: {{description}}
{{/each}}
`,
});

// Define the Genkit flow.
const generateDraftAndSummarizeFlow = ai.defineFlow(
  {
    name: 'generateDraftAndSummarizeFlow',
    inputSchema: GenerateDraftInputSchema,
    outputSchema: GenerateDraftOutputSchema,
  },
  async (input) => {
    console.log('AGENT: Starting generateDraftAndSummarizeFlow with input:', input);
    
    const promptInput = {
      ...input,
      strategicGoals,
      JSONstringify: (obj: any) => JSON.stringify(obj, null, 2),
    };

    const { output } = await generateDraftPrompt(promptInput);
    
    if (!output) {
      throw new Error('The agent failed to generate a draft document.');
    }
    
    console.log('AGENT: Successfully generated draft document.');
    return output;
  }
);
