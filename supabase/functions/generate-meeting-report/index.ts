import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { meetingData } = await req.json();

        if (!meetingData) {
            return new Response(
                JSON.stringify({ error: "Missing meetingData" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
        if (!anthropicApiKey) {
            throw new Error("Missing ANTHROPIC_API_KEY environment variable");
        }

        const { date, duration, events, metrics } = meetingData;

        // Formatting events for the prompt
        const eventsText = events.map((e: unknown, i: number) => {
            return `Event ${i + 1}: Action="${e.action_type}", Initiative="${e.initiative_title}", Rationale="${e.rationale}"`;
        }).join("\n");

        const systemPrompt = `You are an expert PMO Director operating the AlturaGov Command Centre. 
Generate a formal, highly professional governance minute detailing the outcomes of the Strategic Portfolio Meeting.
Your tone must be authoritative, objective, and analytical. Avoid jargon where plain English is clearer, but use strict governance terminology (e.g., "Fiscal Drag", "Capacity Baseline", "Focus Slots", "Approved", "Halted", "Sequenced").

Structure the report using markdown with the following sections:
# Strategic Portfolio Review: Governance Minutes
**Date:** ${date}
**Duration:** ${duration}

## 1. Executive Summary
Provide a 2-3 sentence summary of the meeting's primary outcomes, highlighting the net impact on organisational capacity and any major strategic pivots.

## 2. Portfolio Decisions
List the specific initiatives that were approved, halted/paused, or re-sequenced. Use bullet points. Ensure the rationale for each decision is clearly justified based on the provided event logs.

## 3. Capacity & Fiscal Impact
Summarise the resulting state of the portfolio based on these final metrics:
- Peak Focus Load: ${metrics.focusLoad} / ${metrics.focusLimit} Slots
- Active Capex: $${metrics.capexLoad}
- Active Opex: $${metrics.opexLoad}
- Fiscal Drag (Tier 2/3 commitment): $${metrics.fiscalDrag}

End with a specific recommendation or warning if the Peak Focus Load exceeds the limit, or if Fiscal Drag remains high.`;

        const userMessage = `Here is the raw event log from the meeting:\n\n${eventsText}\n\nPlease generate the governance minutes.`;

        // Call Claude API
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": anthropicApiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-latest",
                max_tokens: 1500,
                system: systemPrompt,
                messages: [{ role: "user", content: userMessage }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Claude API Error:", errorText);
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const aiData = await response.json();
        const reportText = aiData.content[0].text;

        return new Response(
            JSON.stringify({ report: reportText }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: unknown) {
        console.error("Error generating meeting report:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
