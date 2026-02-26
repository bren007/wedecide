import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

export async function generateAnalysis(
    apiKey: string,
    payload: any
) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            // Define exactly what structure we want back from the LLM
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    section3: { type: SchemaType.STRING },
                    scenarioA: { type: SchemaType.STRING },
                    scenarioB: { type: SchemaType.STRING },
                    recoveredSlots: { type: SchemaType.INTEGER }
                },
                required: ["section3", "scenarioA", "scenarioB", "recoveredSlots"]
            }
        }
    });

    const jsonString = JSON.stringify(payload, null, 2);

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
- recoveredSlots: Give the exact mathematical total of Focus Slots recovered by parking those initiatives.
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
- recoveredSlots: Give the exact mathematical total of Focus Slots reassigned by stopping those initiatives.
`;

    const promptText = `
You are a Lead Governance Strategist at AlturaGov, writing a formal Strategic Capacity Assessment for a public sector Chief Executive. Your task is to write Section 3 ("Where Your Strategy is Exposed") and Section 4 ("Trade-Off Scenarios") based strictly on the provided portfolio data.

# TONE AND STYLE GOVERNING RULES
1. Tone: Authoritative, objective, and plain-speaking. You are advising a peer. 
2. Forbidden Words: Never use leverage, holistic, synergy, solution, seamless, intuitive, real-time, game-changing, robust, best-in-class, or stakeholder.
3. Voice: Active voice only. 
4. Specificity: Every analytical statement MUST directly reference a specifically named initiative from the data payload and its calculated Focus Slot constraint. If a sentence could apply to any other organisation, delete it.
5. Posture: Do not pitch AlturaGov software. State the mathematical reality of their capacity.

${isOverCapacity ? crisisPrompt : optimizationPrompt}

# INPUT DATA
<portfolio_data>
${jsonString}
</portfolio_data>
`;

    const result = await model.generateContent(promptText);
    const text = result.response.text();
    try {
        const parsed = JSON.parse(text);
        return parsed;
    } catch (e) {
        console.error("Failed to parse Gemini JSON:", text);
        return {
            section3: "Error retrieving analysis.",
            scenarioA: "Error retrieving scenario.",
            scenarioB: "Error retrieving scenario.",
            recoveredSlots: 0
        };
    }
}
