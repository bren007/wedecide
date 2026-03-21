import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { action, audit_token: raw_token } = await req.json();

        if (!raw_token) {
            return new Response(
                JSON.stringify({ status: "error", message: "Missing audit_token" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Normalize token: ALTA-XXXX-XXXX -> ALTA-XXXXXXXX
        const cleaned = raw_token.replace(/\s+/g, '').toUpperCase();
        const prefixMatch = cleaned.match(/^ALTA-?(.*)$/);
        const audit_token = prefixMatch && prefixMatch[1] 
            ? `ALTA-${prefixMatch[1].replace(/-/g, '')}`
            : cleaned;

        // Create admin client (service role) for reading audit data
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Create user client for getting authenticated user's org
        const supabaseUser = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        );

        // Get authenticated user
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
        if (userError || !user) {
            return new Response(
                JSON.stringify({ status: "error", message: "Not authenticated" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
            );
        }

        // Get user's organization_id
        const { data: userData, error: userDataError } = await supabaseAdmin
            .from("users")
            .select("organization_id")
            .eq("id", user.id)
            .single();

        if (userDataError || !userData?.organization_id) {
            return new Response(
                JSON.stringify({ status: "error", message: "User has no organization" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const orgId = userData.organization_id;

        // Look up the audit record by token
        const { data: auditRecord, error: auditError } = await supabaseAdmin
            .from("leads")
            .select("id, audit_token_status, audit_parsed_json, audit_completed_at, licence_org_id, calibration_large_steerable, calibration_historical_avg, capacity_baseline")
            .eq("audit_token", audit_token)
            .single();

        if (auditError || !auditRecord) {
            return new Response(
                JSON.stringify({ status: "not_found" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ---- ACTION: VALIDATE ----
        if (action === "validate") {
            if (auditRecord.audit_token_status === "consumed") {
                return new Response(
                    JSON.stringify({ status: "already_consumed" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const parsedJson = auditRecord.audit_parsed_json;
            if (!parsedJson || !Array.isArray(parsedJson)) {
                return new Response(
                    JSON.stringify({ status: "not_found" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({
                    status: "valid",
                    initiative_count: parsedJson.length,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ---- ACTION: DECLINE ----
        if (action === "decline") {
            await supabaseAdmin
                .from("leads")
                .update({ audit_token_status: "declined" })
                .eq("audit_token", audit_token);

            return new Response(
                JSON.stringify({ status: "declined" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ---- ACTION: IMPORT ----
        if (action === "import") {
            if (auditRecord.audit_token_status === "consumed") {
                return new Response(
                    JSON.stringify({ status: "error", message: "Token already consumed" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
                );
            }

            const parsedJson = auditRecord.audit_parsed_json;
            if (!parsedJson || !Array.isArray(parsedJson)) {
                return new Response(
                    JSON.stringify({ status: "error", message: "No portfolio data found" }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
                );
            }

            // 1. Resolve Pillars (String Name -> UUID)
            const pillarNames = [...new Set(parsedJson.map((i: any) => i.alignment_pillar).filter(Boolean))];
            const pillarMap: Record<string, string> = {};

            for (const name of pillarNames) {
                // Try to find existing pillar for this org
                const { data: existingPillar } = await supabaseAdmin
                    .from("strategic_pillars")
                    .select("id")
                    .eq("org_id", orgId)
                    .eq("title", name)
                    .maybeSingle();

                if (existingPillar) {
                    pillarMap[name as string] = existingPillar.id;
                } else {
                    // Create missing pillar for this org
                    const { data: newPillar, error: pillarError } = await supabaseAdmin
                        .from("strategic_pillars")
                        .insert({ org_id: orgId, title: name })
                        .select("id")
                        .single();
                    
                    if (pillarError) {
                        console.error(`[IMPORT] Failed to create pillar "${name}":`, pillarError);
                    } else if (newPillar) {
                        pillarMap[name as string] = newPillar.id;
                    }
                }
            }

            // 2. Insert all initiatives with full data retention
            let imported = 0;
            let errors = 0;
            let lastErrorMessage = "";

            for (const initiative of parsedJson) {
                const { error: insertError } = await supabaseAdmin
                    .from("initiatives")
                    .insert({
                        org_id: orgId,
                        owner_id: user.id,
                        title: initiative.initiative_name || initiative.title || "Untitled",
                        focus_slots: initiative.calculated_focus_slots || initiative.focus_slots || 3,
                        
                        // Financial Mapping: Unified current_fy_budget maps to operational budget
                        opex_required: initiative.current_fy_budget || 0,
                        capex_required: 0,
                        current_fy_budget: initiative.current_fy_budget || 0,

                        // Multi-year and metadata
                        total_initiative_cost: initiative.total_initiative_cost || initiative.current_fy_budget || 0,
                        is_multi_year: initiative.is_multi_year || false,
                        future_annual_opex: initiative.future_annual_opex || 0,

                        // Gate/Mandate logic: strictly validate against DB CHECK constraints
                        approval_mandate: ['Cabinet Approved', 'Ministerial Approved', 'Board/Delegated', 'Pre-Approval'].includes(initiative.approval_mandate) ? initiative.approval_mandate : null,
                        relative_priority: ['Tier 1', 'Tier 2', 'Tier 3'].includes(initiative.relative_priority) ? initiative.relative_priority : null,
                        target_delivery_quarter: initiative.target_delivery_quarter || null,
                        
                        // Pillar Link
                        strategic_pillar_id: initiative.alignment_pillar ? pillarMap[initiative.alignment_pillar] : null,
                        
                        short_term_win: initiative.short_term_win || false,
                        status: "proposed",
                    });

                if (insertError) {
                    console.error(`[IMPORT] Error for initiative "${initiative.initiative_name || initiative.title}":`, insertError);
                    errors++;
                    lastErrorMessage = insertError.message;
                } else {
                    imported++;
                }
            }

            if (imported === 0 && parsedJson.length > 0) {
                return new Response(
                    JSON.stringify({ 
                        status: "error", 
                        message: `Failed to import any initiatives: ${lastErrorMessage}` 
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
                );
            }

            // Mark token as consumed and record the licence org
            const { error: consumeError } = await supabaseAdmin
                .from("leads")
                .update({
                    audit_token_status: "consumed",
                    licence_org_id: orgId,
                })
                .eq("audit_token", audit_token);

            if (consumeError) {
                console.error("[IMPORT] Failed to mark token as consumed:", consumeError);
            }

            // Pre-populate capacity_settings from audit calibration
            if (auditRecord.calibration_large_steerable && auditRecord.calibration_historical_avg) {
                const baseline = auditRecord.capacity_baseline || 
                    (auditRecord.calibration_large_steerable * 5) + (Math.max(0, auditRecord.calibration_historical_avg - auditRecord.calibration_large_steerable) * 3);

                // Check if capacity_settings exists for this org
                const { data: existingSettings } = await supabaseAdmin
                    .from("capacity_settings")
                    .select("id")
                    .eq("org_id", orgId)
                    .maybeSingle();

                if (existingSettings) {
                    const { error: capUpdateError } = await supabaseAdmin
                        .from("capacity_settings")
                        .update({
                            calibration_large_steerable: auditRecord.calibration_large_steerable,
                            calibration_historical_avg: auditRecord.calibration_historical_avg,
                            total_focus_slots: baseline,
                        })
                        .eq("id", existingSettings.id);
                    if (capUpdateError) console.error("[IMPORT] Failed to update capacity_settings:", capUpdateError);
                    else console.log(`[IMPORT] Updated capacity_settings: baseline=${baseline}`);
                } else {
                    const { error: capInsertError } = await supabaseAdmin
                        .from("capacity_settings")
                        .insert({
                            org_id: orgId,
                            calibration_large_steerable: auditRecord.calibration_large_steerable,
                            calibration_historical_avg: auditRecord.calibration_historical_avg,
                            total_focus_slots: baseline,
                            total_capex_limit: 0,
                            total_opex_limit: 0,
                        });
                    if (capInsertError) console.error("[IMPORT] Failed to insert capacity_settings:", capInsertError);
                    else console.log(`[IMPORT] Created capacity_settings: baseline=${baseline}`);
                }
            }

            return new Response(
                JSON.stringify({
                    status: "success",
                    imported,
                    errors,
                    message: `Imported ${imported} initiatives${errors > 0 ? `, ${errors} failed` : ""}`,
                    calibration: {
                        large_steerable: auditRecord.calibration_large_steerable || null,
                        historical_avg: auditRecord.calibration_historical_avg || null,
                        capacity_baseline: auditRecord.capacity_baseline || null,
                    }
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ status: "error", message: "Unknown action" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    } catch (err) {
        console.error("Error:", err);
        return new Response(
            JSON.stringify({ status: "error", message: err.message || "Internal error" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
