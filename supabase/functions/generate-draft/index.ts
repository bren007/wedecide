// @ts-nocheck — This file runs in Supabase's Deno runtime, not Node.js
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── AI API Calls ──────────────────────────────────────────────────────

async function callGemini(apiKey: string, prompt: string): Promise<string> {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 },
            }),
        }
    );
    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 4000,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        }),
    });
    const json = await res.json();
    return json.content?.[0]?.text || "";
}

// ── Agent 1: Gemini — Structured Analytical Brief ─────────────────────

async function runAgent1(geminiApiKey: string, payload: any): Promise<any> {
    const jsonString = JSON.stringify(payload, null, 2);

    const prompt = `You are a quantitative portfolio analyst. Your task is to analyse the provided portfolio data and produce a structured analytical brief for Section 3 and Section 4 of a Strategic Capacity Assessment. You do not write the final report — you produce the factual and mathematical foundation that the report editor will work from.

Your analysis must be derived entirely from the data provided. Do not infer values, assume context, or generalise from sector knowledge. Every finding must be traceable to a specific field value in the input data.

Perform the following analyses in sequence and return them as a single JSON object. Return ONLY valid JSON with no markdown formatting, no code fences, and no explanatory text outside the JSON.

**1. Portfolio Shape Analysis**
- Count total initiatives by relative_priority tier (Tier 1, Tier 2, Tier 3)
- Count total initiatives by approval_mandate category
- Calculate total Focus Slots by tier
- Calculate total Focus Slots by target_delivery_quarter — identify any quarter where clustered load exceeds 30% of the capacity baseline
- Calculate Fiscal Drag: sum current_fy_budget for all Tier 2 and Tier 3 initiatives
- Identify the approval mandate / priority tension: list every initiative where approval_mandate is Cabinet Approved or Ministerial Approved but relative_priority is Tier 2 or Tier 3

**2. Overcommitment Calculation**
- State the total portfolio load (use the exact total_current_load value from the input data) vs the capacity baseline (use the exact calculated_capacity_baseline value from the input data). NEVER substitute the number of initiatives for the capacity baseline.
- Express overcommitment as a percentage based on these two pre-calculated values
- Calculate the absolute slot deficit (total load minus baseline)
- Identify the minimum number of initiatives that would need to be re-sequenced or suspended to reach the baseline

**3. At-Risk Programme Identification**
- List every Tier 1 and Cabinet/Ministerially mandated initiative
- For each, state its Focus Slot cost, target_delivery_quarter, and whether any of its dependency_blockers are Tier 2 or Tier 3 initiatives
- Assess whether the delivery quarter cluster it sits in exceeds the capacity baseline — if yes, flag as structurally at risk

**4. Scenario Construction Data**
For each of three scenarios, calculate the following and return as structured data — do not write narrative:

Scenario A (Inaction): Project the delivery outlook for each Tier 1 and mandated initiative if no changes are made. For each at-risk programme, state which delivery quarter cluster it fails in and what the fiscal tail exposure is over 24 months.

Scenario B (De-escalation): Identify all Pre-Approval and Tier 3 initiatives. Calculate total slots recovered if all are suspended. State the resulting load as a percentage of baseline. State explicitly whether this closes the deficit or only partially addresses it, expressed as a percentage of the total gap closed.

Scenario C (Baseline Reset): Calculate the additional slot recovery required beyond Scenario B to reach the baseline. Identify the specific Tier 2 or mandated initiatives that must be re-sequenced to achieve this. For each, propose a revised target_delivery_quarter that distributes load below the baseline threshold. State the resulting load as a percentage of baseline after all re-sequencing. Express total gap closure as a percentage.

Return all findings as a single JSON object with keys: portfolio_shape, overcommitment, at_risk_programmes, scenario_a, scenario_b, scenario_c.

<portfolio_data>
${jsonString}
</portfolio_data>`;

    console.log("[AGENT 1] Calling Gemini for structured analytical brief...");
    const rawText = await callGemini(geminiApiKey, prompt);
    console.log("[AGENT 1] Gemini response received.");

    // Parse the JSON response, stripping any markdown fences
    let cleanedJson = rawText.trim();
    if (cleanedJson.includes("```json")) {
        cleanedJson = cleanedJson.split("```json")[1].split("```")[0].trim();
    } else if (cleanedJson.includes("```")) {
        cleanedJson = cleanedJson.split("```")[1].split("```")[0].trim();
    }

    try {
        return JSON.parse(cleanedJson);
    } catch (e) {
        console.error("[AGENT 1] Failed to parse Gemini JSON:", e);
        console.error("[AGENT 1] Raw response:", rawText.substring(0, 1000));
        // Return the raw text as a fallback so Agent 2 can still work with it
        return { raw_text: rawText, parse_error: true };
    }
}

// ── Agent 2: Claude — Editor-in-Chief ─────────────────────────────────

async function runAgent2(anthropicApiKey: string, agent1Analysis: any, payload: any): Promise<any> {
    const systemPrompt = `You are an expert Lead Editor at AlturaGov. You translate structured analytical findings into authoritative executive prose. Format your response strictly as valid JSON.`;

    const userPrompt = `**Role:**
You are the Lead Editor at AlturaGov. Your task is to rewrite the structured analytical brief in <raw_analysis> into two sections of a formal Strategic Capacity Assessment for a public sector executive team. You are translating mathematical findings into executive prose — you are not performing analysis, and you must not introduce findings, initiatives, or figures that are not present in the raw analysis.

**Narrative Core:**
The central theme is Ambition vs. Reality. A strategic portfolio contains politically sanctioned, organisationally important work. Cabinet mandates do not suspend the physics of delivery capacity. The report's value lies in stating this plainly, with evidence, in terms that the organisation's leadership can act on and defend under scrutiny.

**Strict Style Guide:**
1. Audit Lexicon: Use precise governance terms — Suspend, Halt, De-prioritise, Re-sequence. Never use informal terms.
2. Mandate vs. Priority: Maintain the distinction between approval_mandate (political sanction) and relative_priority (sequencing intent) throughout. Never conflate the two.
3. Re-sequencing framing: When recommending re-sequencing in Scenario C, always name the specific initiative, its current target_delivery_quarter, and the proposed revised quarter from the raw analysis. Never describe re-sequencing in the abstract.
4. Gap-closure discipline: Each scenario must state explicitly what percentage of the total slot deficit it closes. A scenario that closes less than 25% of the deficit must include a sentence acknowledging this limitation plainly.
5. Voice: Senior analyst advising a peer. Precise, direct, without diplomatic softening. Active voice throughout. Short paragraphs. No sentence longer than 25 words.
6. Risk Attribution: Never attribute risk acceptance or consequences personally to a "Chief Executive". Attribute risks to "the organisation", "executive governance", or "the executive group".
7. Forbidden words: leverage, holistic, synergy, solution, seamless, paradigm, ecosystem, stakeholder, value-add, robust, best-in-class, park, put on ice, going forward, it should be noted, it is recommended, Chief Executive.

**Required JSON Output Structure:**
Return ONLY a raw JSON object with no markdown formatting outside the JSON structure.
{
  "internal_critique": "One sentence identifying the primary weakness in the raw draft that required the most significant editorial intervention.",
  "final_section_3": "Section 3: Where Ambition Exceeds Capacity. Four paragraphs: (1) Portfolio shape — describe the distribution of initiatives across tiers, approval mandates, and delivery quarters. (2) The mathematical finding — state the overcommitment percentage and absolute slot deficit as facts. (3) Mandated programmes at risk — identify specific Tier 1 and Cabinet/Ministerially mandated initiatives that are structurally undeliverable, naming each and its delivery quarter cluster. (4) The structural diagnosis — one sentence, written as an auditor's finding.",
  "final_section_4": "Section 4: Courses of Action. Three scenarios under exact headers as follows: Scenario A — The Trajectory of Inaction. Scenario B — Pragmatic De-escalation. Scenario C — The Baseline Reset. Each scenario must state its gap-closure percentage. Scenario C must name specific initiatives with specific revised delivery quarters. End with a single closing paragraph stating that the choice between these courses of action is a governance decision, that this report provides the objective basis for that decision, and that all findings are available as a formal baseline for any subsequent review or audit. No commercial references. No next steps."
}

**Input Data:**
<raw_analysis>
${JSON.stringify(agent1Analysis, null, 2)}
</raw_analysis>

<portfolio_summary>
Organisation: ${payload.organisation_name}
Capacity Baseline: ${payload.calculated_capacity_baseline} Focus Slots (derived from executive steering capacity of ${payload.calibration.large_steerable} large initiatives and historical throughput of ${payload.calibration.historical_avg} active projects)
Total Current Load: ${payload.total_current_load} Focus Slots
Overcommitment: ${payload.overcommitment_pct}% (${payload.absolute_slot_deficit > 0 ? `deficit of ${payload.absolute_slot_deficit} slots` : 'within limits'})
Fiscal Drag: $${payload.fiscal_drag.toLocaleString()}
Total Initiatives: ${payload.portfolio.length}
</portfolio_summary>

<verified_mathematical_findings>
CRITICAL DIRECTIVE: These are verified geometric facts. You MUST use these exact numbers. If the raw analysis proposes different mathematics, the raw analysis is WRONG and you must overwrite it with these figures:
- Maximum Capacity Baseline: ${payload.calculated_capacity_baseline} Focus Slots
- Total Portfolio Load: ${payload.total_current_load} Focus Slots
- Overcommitment: ${payload.overcommitment_pct}% of structural capacity
- Absolute Slot Deficit: ${payload.absolute_slot_deficit}
- Fiscal Drag: $${payload.fiscal_drag.toLocaleString()}
${payload.total_current_load > payload.calculated_capacity_baseline ? `\nCRITICAL FINDING (inject verbatim at end of Section 3 opening paragraph): "At this load, fiscal drag is structurally guaranteed, and Tier 1 mandated programmes are mathematically at risk of failure through resource starvation."` : ''}
</verified_mathematical_findings>`;

    console.log("[AGENT 2] Calling Claude for editorial rewrite...");
    const claudeRespText = await callClaude(anthropicApiKey, systemPrompt, userPrompt);
    console.log("[AGENT 2] Claude response received.");

    let cleanedJsonStr = claudeRespText.trim();
    if (cleanedJsonStr.includes("```json")) {
        cleanedJsonStr = cleanedJsonStr.split("```json")[1].split("```")[0].trim();
    } else if (cleanedJsonStr.includes("```")) {
        cleanedJsonStr = cleanedJsonStr.split("```")[1].split("```")[0].trim();
    }

    try {
        const parsed = JSON.parse(cleanedJsonStr);
        return {
            internal_critique: parsed.internal_critique || "No critique provided.",
            section3: parsed.final_section_3 || "Error: Section 3 not generated.",
            section4: parsed.final_section_4 || "Error: Section 4 not generated.",
        };
    } catch (e) {
        console.error("[AGENT 2] Claude JSON parse error:", e);
        return {
            internal_critique: "Claude output was not valid JSON. Using raw text as fallback.",
            section3: claudeRespText.substring(0, Math.floor(claudeRespText.length / 2)),
            section4: claudeRespText.substring(Math.floor(claudeRespText.length / 2)),
        };
    }
}

// ── Portfolio Parser ──────────────────────────────────────────────────

function parsePortfolio(csvString: string, lead: any, calibration: { large_steerable: number, historical_avg: number }) {
    const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
    const rows = parsed.data;

    let fiscalDrag = 0;
    const initiativeMap = new Map<string, any>();

    const initiatives = rows.map((row: any, index: number) => {
        const name = row["initiative_name"] || `Initiative ${index + 1}`;
        const stake = parseInt(row["complexity_stakeholders_1_to_3"] || "1", 10);
        const tech = parseInt(row["complexity_novelty_1_to_3"] || "1", 10);
        const dep = parseInt(row["complexity_dependency_1_to_3"] || "1", 10);

        let cost = Math.ceil((stake + tech + dep) / 1.5);
        if (cost < 1) cost = 1;
        if (cost > 6) cost = 6;

        let budget = 0;
        const rawBudget = row["current_fy_budget"] || "0";
        const parsedBudget = parseInt(String(rawBudget).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsedBudget)) budget = parsedBudget;

        const approvalMandate = row["approval_mandate"] || "Unknown";
        const relativePriority = row["relative_priority"] || "Unknown";
        const targetQuarter = row["target_delivery_quarter"] || "";

        // Fiscal Drag = budget committed to Tier 2 + Tier 3
        if (relativePriority === "Tier 2" || relativePriority === "Tier 3") {
            fiscalDrag += budget;
        }

        const blockersStr = row["dependency_blockers"] || "";
        const blockers = blockersStr.split(",").map((b: string) => b.trim()).filter(Boolean);

        const initObj = {
            initiative_name: name,
            alignment_pillar: row["strategic_pillar"] || "Uncategorised",
            approval_mandate: approvalMandate,
            relative_priority: relativePriority,
            calculated_focus_slots: cost,
            fiscal_tail_impact: budget,
            target_delivery_quarter: targetQuarter,
            blockers,
            lifecycle_stage: row["lifecycle_stage"] || "",
            start_date: row["start_date"],
        };
        initiativeMap.set(name, initObj);
        return initObj;
    });

    // Dependency risks
    const dependencyRiskList: any[] = [];
    initiatives.forEach((init: any) => {
        if (init.approval_mandate === "Cabinet Approved" || init.approval_mandate === "Ministerial Approved" || init.relative_priority === "Tier 1") {
            init.blockers.forEach((b: string) => {
                const blockerInit = initiativeMap.get(b);
                if (blockerInit && (blockerInit.relative_priority === "Tier 2" || blockerInit.relative_priority === "Tier 3")) {
                    dependencyRiskList.push({
                        high_priority_initiative: init.initiative_name,
                        blocked_by: blockerInit.initiative_name,
                        blocker_priority: blockerInit.relative_priority,
                    });
                }
            });
        }
    });

    const totalLoad = initiatives.reduce((sum: number, init: any) => sum + init.calculated_focus_slots, 0);

    // Capacity Baseline from Slot-Sync calibration (unified formula)
    const capacityBaseline = (calibration.large_steerable * 5) + (Math.max(0, calibration.historical_avg - calibration.large_steerable) * 3);

    // Pre-calculated hard facts (injected into AI prompts, not for AI to derive)
    const rawOverPct = capacityBaseline > 0 ? Math.round(((totalLoad - capacityBaseline) / capacityBaseline) * 100) : 0;
    const overcommitmentPct = Math.max(0, rawOverPct);
    const absoluteSlotDeficit = Math.max(0, totalLoad - capacityBaseline);

    return {
        organisation_name: lead.organization_name || "Public Sector Organisation",
        calculated_capacity_baseline: capacityBaseline,
        total_current_load: totalLoad,
        overcommitment_pct: overcommitmentPct,
        absolute_slot_deficit: absoluteSlotDeficit,
        fiscal_drag: fiscalDrag,
        dependency_risk_list: dependencyRiskList,
        portfolio: initiatives,
        calibration: {
            large_steerable: calibration.large_steerable,
            historical_avg: calibration.historical_avg,
        },
    };
}

// ── Main Handler ──────────────────────────────────────────────────────

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, calibration_large_steerable, calibration_historical_avg } = await req.json();
        if (!email) {
            return new Response(JSON.stringify({ error: "Email is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
        if (!calibration_large_steerable || !calibration_historical_avg) {
            return new Response(JSON.stringify({ error: "Calibration inputs are required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
        const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch lead
        console.log(`[DRAFT] Fetching lead for ${email}`);
        const { data: leads, error: leadError } = await supabase
            .from("leads")
            .select("*")
            .eq("email", email);

        if (leadError || !leads || leads.length === 0) {
            throw new Error("Lead not found or error fetching lead.");
        }

        const lead = leads[0];
        if (!lead.file_url) {
            throw new Error("No dataset uploaded for this lead.");
        }

        // 2. Download CSV
        console.log(`[DRAFT] Downloading CSV: ${lead.file_url}`);
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("audit_uploads")
            .download(lead.file_url);

        if (downloadError || !fileData) {
            throw new Error(`Failed to download portfolio dataset: ${downloadError?.message}`);
        }

        const csvString = await fileData.text();

        // 3. Parse portfolio with calibration
        const calibration = {
            large_steerable: parseInt(calibration_large_steerable, 10),
            historical_avg: parseInt(calibration_historical_avg, 10),
        };
        const payload = parsePortfolio(csvString, lead, calibration);
        console.log(`[DRAFT] Parsed ${payload.portfolio.length} initiatives, ${payload.total_current_load} total slots, baseline: ${payload.calculated_capacity_baseline}`);

        // 4. Agent 1: Gemini structured analysis
        const agent1Analysis = await runAgent1(geminiKey, payload);

        // 5. Agent 2: Claude editorial rewrite
        const analysis = await runAgent2(anthropicKey, agent1Analysis, payload);

        return new Response(
            JSON.stringify({ success: true, data: payload, analysis }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("[DRAFT ERROR]", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
