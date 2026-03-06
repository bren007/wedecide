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
        const { action, audit_token } = await req.json();

        if (!audit_token) {
            return new Response(
                JSON.stringify({ status: "error", message: "Missing audit_token" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

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
            .select("id, audit_token_status, audit_parsed_json, audit_completed_at, licence_org_id")
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

            // Insert all initiatives scoped to the user's org
            let imported = 0;
            let errors = 0;

            for (const initiative of parsedJson) {
                const { error: insertError } = await supabaseAdmin
                    .from("initiatives")
                    .insert({
                        org_id: orgId,
                        owner_id: user.id,
                        title: initiative.title || initiative.initiative_name || "Untitled",
                        focus_slots: initiative.focus_slots || initiative.focus_slots_required || 3,
                        capex_current_fy: initiative.capex_current_fy || initiative.capex_required || 0,
                        opex_current_fy: initiative.opex_current_fy || initiative.opex_required || 0,
                        total_initiative_cost: initiative.total_initiative_cost || 0,
                        is_multi_year: initiative.is_multi_year || false,
                        future_annual_opex: initiative.future_annual_opex || 0,
                        short_term_win: initiative.short_term_win || false,
                        approval_mandate: initiative.approval_mandate || null,
                        relative_priority: initiative.relative_priority || null,
                        target_delivery_quarter: initiative.target_delivery_quarter || null,
                        current_fy_budget: initiative.current_fy_budget || 0,
                        status: "proposed",
                    });

                if (insertError) {
                    console.error("Import error for initiative:", initiative.title, insertError);
                    errors++;
                } else {
                    imported++;
                }
            }

            // Mark token as consumed and record the licence org
            await supabaseAdmin
                .from("leads")
                .update({
                    audit_token_status: "consumed",
                    licence_org_id: orgId,
                })
                .eq("audit_token", audit_token);

            return new Response(
                JSON.stringify({
                    status: "success",
                    imported,
                    errors,
                    message: `Imported ${imported} initiatives${errors > 0 ? `, ${errors} failed` : ""}`,
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
