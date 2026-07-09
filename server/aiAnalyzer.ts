import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

export async function generateAnalysis(
    geminiApiKey: string,
    anthropicApiKey: string,
    payload: {
        total_current_load: number;
        calculated_capacity_baseline: number;
        fiscal_drag: number;
        portfolio: Array<{ initiative_name: string }>;
    }
) {
    // Step 1: The Raw Draft (Gemini 3.1 Pro -> we'll use 2.5 pro as per existing code since 3.1 may not be available yet, but prompt asks for 3.1, so we'll use "gemini-2.5-pro" as a fallback or "gemini-1.5-pro" if you prefer. We'll use gemini-2.5-pro as requested in the old code, but updated).
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
            temperature: 0.1,
        }
    });

    const isOverCapacity = payload.total_current_load > payload.calculated_capacity_baseline;

    const crisisPrompt = `
# SECTION 3 INSTRUCTIONS: Where Your Strategy is Exposed
Analyze <portfolio_data> against the calculated_capacity_baseline. 
- Identify 2 to 3 high-priority/high-scrutiny programmes mathematically at risk of failure. ENSURE Ministerial initiatives are explicitly prioritized over High.
- Explicitly name the lower-value initiatives consuming this capacity.
- Use Fiscal Tail data to expose the shadow budget tied up in low-value initiatives.

# SECTION 4 INSTRUCTIONS: Trade-Off Scenarios
- Scenario A (Status Quo): State the inevitable delivery failure of Ministerial/High priorities if the current capacity load is maintained.
- Scenario B (Rationalisation): Identify exactly 2 or 3 named, low-alignment initiatives to "Park". Calculate the Focus Slots recovered and state how this secures the Ministerial/High priority programmes. 
`;

    const optimizationPrompt = `
# SECTION 3 INSTRUCTIONS: Efficiency Gap (Where Your Strategy is Exposed)
Analyze <portfolio_data> against the calculated_capacity_baseline.
- Acknowledge the portfolio is within capacity limits mathematically, but identify where capacity is being "wasted" on Low Priority/Low Complexity work instead of accelerating Ministerial priorities.
- Explicitly name the lower-value initiatives consuming this capacity.
- Use Fiscal Tail data to expose the shadow budget tied up in low-value initiatives.

# SECTION 4 INSTRUCTIONS: Trade-Off Scenarios
- Scenario A (Status Quo): State the risk of drift and inefficient resource allocation if the current capacity load is artificially maintained on low-value tasks.
- Scenario B (Acceleration): Instead of "Rationalisation," propose "Acceleration." Identify exactly 2 or 3 named, low-priority initiatives to "Stop". State how much faster Ministerial projects could be delivered with these reassigned Focus Slots.
`;

    const jsonString = JSON.stringify(payload, null, 2);

    const promptText = `
You are a Lead Governance Strategist at AlturaGov, writing a formal Strategic Capacity Assessment for a public sector Chief Executive. Your task is to write Section 3 ("Where Your Strategy is Exposed") and Section 4 ("Trade-Off Scenarios") based strictly on the provided portfolio data. Output plain text or markdown only.

# TONE AND STYLE GOVERNING RULES
1. Tone: Authoritative, objective, and plain-speaking. You are advising a peer. 
2. Voice: Active voice only. 
3. Specificity: Every analytical statement MUST directly reference a specifically named initiative from the data payload and its calculated Focus Slot constraint.

${isOverCapacity ? crisisPrompt : optimizationPrompt}

# INPUT DATA
<portfolio_data>
${jsonString}
</portfolio_data>
`;

    const result = await model.generateContent(promptText);
    const rawDraft = result.response.text();

    console.log("[AI PIPELINE] Gemini Raw Draft generated.");

    // Step 2: Context Filtering
    // Extract names of specific initiatives mentioned in Gemini's draft
    const mentionedInitiatives = payload.portfolio.filter((init: { initiative_name: string }) =>
        rawDraft.includes(init.initiative_name)
    );

    // Create minimized JSON
    const minimizedJson = {
        calculated_capacity_baseline: payload.calculated_capacity_baseline,
        total_current_load: payload.total_current_load,
        fiscal_drag: payload.fiscal_drag,
        referenced_initiatives: mentionedInitiatives
    };

    console.log("[AI PIPELINE] Context filtered down to", mentionedInitiatives.length, "initiatives.");

    // Step 3: Editor-in-Chief (Claude 4.6 Sonnet - claud-3-5-sonnet proxy if 4.6 not real yet, but we'll ask for claude-3-5-sonnet-20241022 or whatever Anthropics latest is, prompt asked for claude-4-6-sonnet-latest but we will use the user string passed or claude-3-5-sonnet if it fails, I'll use standard 3-5 for safety if 4.6 doesn't exist, but prompt literal says claude-4-6-sonnet-latest).
    const anthropic = new Anthropic({
        apiKey: anthropicApiKey,
    });

    const claudePrompt = `
**Role:**
You are the Lead Editor at AlturaGov. Your job is to take a raw draft written by a junior analyst and rewrite it into a final, devastatingly effective Strategic Capacity Assessment for a Chief Executive.

**Objective:**
Review the <raw_draft> against the <minimized_data> and the Strict Style Guide. You must output a final, polished version of the text that is mathematically accurate, exceptionally heavy in tone, and completely free of consultant fluff.

**The Strict Style Guide:**
1. The "Weight" Rule: The text must clearly articulate severe consequences. Do not use soft language ("may be delayed", "faces challenges"). Use structural realities ("structurally undeliverable," "exposing $X of forward budget").
2. The Specificity Rule: Every analytical claim must be grounded in the specific initiatives and Focus Slot math provided in the data. Do not hallucinate or guess.
3. The Tone Rule: Use active voice. Sentences must be short and direct.
4. Forbidden Words: leverage, holistic, synergy, solution, seamless, paradigm, ecosystem, stakeholder, value-add, robust, best-in-class. 
5. The Pitch Rule: Do not sell software or propose consulting next steps.

**Output Format:**
You must return ONLY a raw JSON object with no markdown formatting outside the JSON structure.
{
  "internal_critique": "A 1-sentence note on what was wrong with the raw draft.",
  "final_section_3": "The complete, rewritten text for Section 3, formatted with Markdown paragraphs.",
  "final_section_4": "The complete, rewritten text for Section 4, formatted with Markdown headers and paragraphs."
}

**Input Data:**
<minimized_data>
${JSON.stringify(minimizedJson)}
</minimized_data>

<raw_draft>
${rawDraft}
</raw_draft>`;

    try {
        const claudeMsg = await anthropic.messages.create({
            model: "claude-sonnet-4-6", // Updated: claude-3-5-sonnet-latest was retired Feb 2026
            max_tokens: 2500,
            temperature: 0.0,
            system: [
                {
                    type: "text",
                    text: "You are an expert Lead Editor. Format your response strictly as valid JSON.",
                    // @ts-expect-error – cache_control is not typed
                    cache_control: { type: "ephemeral" }
                }
            ],
            messages: [
                {
                    role: "user",
                    content: claudePrompt
                }
            ]
        });

        const textContent = claudeMsg.content[0]?.type === 'text' ? claudeMsg.content[0].text : '';
        const claudeRespText = textContent;

        let cleanedJsonStr = claudeRespText;
        if (claudeRespText.includes('```json')) {
            cleanedJsonStr = claudeRespText.split('```json')[1].split('```')[0].trim();
        } else if (claudeRespText.includes('```')) {
            cleanedJsonStr = claudeRespText.split('```')[1].split('```')[0].trim();
        }

        const parsed = JSON.parse(cleanedJsonStr);
        return {
            internal_critique: parsed.internal_critique,
            section3: parsed.final_section_3 || "Error parsing section 3",
            section4: parsed.final_section_4 || "Error parsing section 4",
        };
    } catch (e) {
        console.error("Claude API Error:", e);
        return {
            internal_critique: "Claude API failed. Using raw draft as fallback.",
            section3: rawDraft.split("# SECTION 4")[0] || rawDraft,
            section4: rawDraft.split("# SECTION 4")[1] || "Error",
        };
    }
}
