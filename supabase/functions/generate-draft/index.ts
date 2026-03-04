import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.177.0/csv/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── AI Analysis Pipeline ──────────────────────────────────────────────

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
            max_tokens: 2500,
            temperature: 0.0,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        }),
    });
    const json = await res.json();
    return json.content?.[0]?.text || "";
}

async function generateAnalysis(geminiApiKey: string, anthropicApiKey: string, payload: any) {
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

    // Step 1: Gemini Raw Draft
    console.log("[AI PIPELINE] Calling Gemini...");
    const rawDraft = await callGemini(geminiApiKey, promptText);
    console.log("[AI PIPELINE] Gemini Raw Draft generated.");

    // Step 2: Context Filtering
    const mentionedInitiatives = payload.portfolio.filter((init: any) =>
        rawDraft.includes(init.initiative_name)
    );

    const minimizedJson = {
        calculated_capacity_baseline: payload.calculated_capacity_baseline,
        total_current_load: payload.total_current_load,
        fiscal_drag: payload.fiscal_drag,
        referenced_initiatives: mentionedInitiatives,
    };

    console.log("[AI PIPELINE] Context filtered to", mentionedInitiatives.length, "initiatives.");

    // Step 3: Claude Editor-in-Chief
    const claudeSystem = "You are an expert Lead Editor. Format your response strictly as valid JSON.";

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
        console.log("[AI PIPELINE] Calling Claude...");
        const claudeRespText = await callClaude(anthropicApiKey, claudeSystem, claudePrompt);

        let cleanedJsonStr = claudeRespText;
        if (claudeRespText.includes("```json")) {
            cleanedJsonStr = claudeRespText.split("```json")[1].split("```")[0].trim();
        } else if (claudeRespText.includes("```")) {
            cleanedJsonStr = claudeRespText.split("```")[1].split("```")[0].trim();
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

// ── Portfolio Parser ──────────────────────────────────────────────────

function parsePortfolio(csvString: string, lead: any) {
    // Parse CSV using Deno std
    const rows = parse(csvString, { skipFirstRow: true });

    let fiscalDrag = 0;
    const initiativeMap = new Map<string, any>();

    const initiatives = rows.map((row: any, index: number) => {
        const name = row["initiative_name"] || row["Name"] || row["Project"] || `Initiative ${index + 1}`;
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

        const priority = row["priority_tier"] || "Standard";
        if (priority === "Low" || priority === "Medium") fiscalDrag += budget;

        const blockersStr = row["dependency_blockers"] || "";
        const blockers = blockersStr.split(",").map((b: string) => b.trim()).filter(Boolean);

        const initObj = {
            initiative_name: name,
            alignment_pillar: row["strategic_pillar"] || "Uncategorised",
            calculated_focus_slots: cost,
            fiscal_tail_impact: budget,
            priority_tier: priority,
            blockers,
            lifecycle_stage: row["lifecycle_stage"] || "",
            start_date: row["start_date"],
        };
        initiativeMap.set(name, initObj);
        return initObj;
    });

    // Dependency risks and zombies
    const dependencyRiskList: any[] = [];
    const zombieProjects: string[] = [];
    const now = new Date();

    initiatives.forEach((init: any) => {
        if (init.priority_tier.includes("Ministerial") || init.priority_tier === "High") {
            init.blockers.forEach((b: string) => {
                const blockerInit = initiativeMap.get(b);
                if (blockerInit && (blockerInit.priority_tier === "Low" || blockerInit.priority_tier === "Medium")) {
                    dependencyRiskList.push({
                        high_priority_initiative: init.initiative_name,
                        blocked_by: blockerInit.initiative_name,
                        blocker_priority: blockerInit.priority_tier,
                    });
                }
            });
        }

        if (
            init.lifecycle_stage.toLowerCase().includes("active") ||
            init.lifecycle_stage.toLowerCase().includes("progress") ||
            init.lifecycle_stage.toLowerCase().includes("flight")
        ) {
            if (init.calculated_focus_slots <= 2 && init.start_date) {
                const sDate = new Date(init.start_date);
                if (!isNaN(sDate.getTime())) {
                    const diffDays = (now.getTime() - sDate.getTime()) / (1000 * 3600 * 24);
                    if (diffDays > 365) zombieProjects.push(init.initiative_name);
                }
            }
        }
    });

    const totalLoad = initiatives.reduce((sum: number, init: any) => sum + init.calculated_focus_slots, 0);

    // Baseline capacity from portfolio_scale
    let parsedBaseline = 5;
    if (lead.portfolio_scale) {
        if (lead.portfolio_scale.includes("11-25")) parsedBaseline = 15;
        else if (lead.portfolio_scale.includes("26-50")) parsedBaseline = 25;
        else if (lead.portfolio_scale.includes("50+")) parsedBaseline = 40;
    }

    return {
        organisation_name: lead.organization_name || "Public Sector Organisation",
        calculated_capacity_baseline: parsedBaseline,
        total_current_load: totalLoad,
        fiscal_drag: fiscalDrag,
        dependency_risk_list: dependencyRiskList,
        zombie_projects: zombieProjects,
        portfolio: initiatives,
    };
}

// ── Main Handler ──────────────────────────────────────────────────────

serve(async (req: Request) => {
    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email } = await req.json();
        if (!email) {
            return new Response(JSON.stringify({ error: "Email is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const authHeader = req.headers.get("Authorization") || "";

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
        const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

        // Use service role for backend operations
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch lead
        console.log(`[DRAFT GENERATOR] Fetching lead for ${email}`);
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

        // 2. Download CSV from storage
        console.log(`[DRAFT GENERATOR] Downloading CSV: ${lead.file_url}`);
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("audit_uploads")
            .download(lead.file_url);

        if (downloadError || !fileData) {
            throw new Error(`Failed to download portfolio dataset: ${downloadError?.message}`);
        }

        const csvString = await fileData.text();

        // 3. Parse portfolio
        const payload = parsePortfolio(csvString, lead);

        // 4. Run AI pipeline
        console.log("[DRAFT GENERATOR] Running AI inference...");
        const analysis = await generateAnalysis(geminiKey, anthropicKey, payload);

        return new Response(
            JSON.stringify({ success: true, data: payload, analysis }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("[DRAFT GENERATOR ERROR]", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
