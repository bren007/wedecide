// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
    const signature = req.headers.get("stripe-signature");

    if (!signature || !endpointSecret) {
        return new Response("Webhook signature or secret missing", { status: 400 });
    }

    let event;
    try {
        const body = await req.text();
        event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Processing event: ${event.type}`);

    try {
        // Event A: checkout.session.completed (The Audit)
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const purchaserEmail = session.metadata?.purchaser_email || session.customer_details?.email;
            const stripeSessionId = session.id;

            // Idempotency Guard
            const { data: existingRecord } = await supabaseAdmin
                .from("audit_records")
                .select("id")
                .eq("stripe_session_id", stripeSessionId)
                .single();

            if (existingRecord) {
                console.log(`Duplicate event for session ${stripeSessionId}, skipping.`);
                return new Response(JSON.stringify({ message: "Duplicate" }), { status: 200 });
            }

            // Generate Audit Token
            const auditToken = `ALTA-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

            // Insert Audit Record
            const { error: insertError } = await supabaseAdmin
                .from("audit_records")
                .insert({
                    purchaser_email: purchaserEmail,
                    stripe_session_id: stripeSessionId,
                    audit_token: auditToken,
                    token_status: "unconsumed",
                    status: "awaiting_csv"
                });

            if (insertError) throw insertError;

            // Update lead status if exists
            await supabaseAdmin
                .from("leads")
                .update({ audit_status: "payment_secured" })
                .eq("email", purchaserEmail);

            // Trigger Pre-Flight Email
            console.log(`📧 Triggering send-preflight-email for: ${purchaserEmail}`);
            try {
                const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke("send-preflight-email", {
                    body: { email: purchaserEmail }
                });
                
                if (emailError) {
                    console.error("❌ Error invoking send-preflight-email:", emailError);
                } else {
                    console.log("✅ send-preflight-email invoked successfully:", emailData);
                }
            } catch (e) {
                console.error("🔥 Exception triggering pre-flight email:", e);
            }
        }

        // Event B: invoice.paid (The Command Centre License)
        if (event.type === "invoice.paid") {
            const invoice = event.data.object;
            const customerEmail = invoice.customer_email;
            const stripeInvoiceId = invoice.id;
            const amount = invoice.amount_paid;
            const currency = invoice.currency;

            // Locate Organization
            const { data: userData } = await supabaseAdmin
                .from("users")
                .select("organization_id")
                .eq("email", customerEmail)
                .single();

            if (userData?.organization_id) {
                const orgId = userData.organization_id;

                // Update Organization License Tier
                // Determination logic for tier could be added here based on amount or product ID
                const licenseTier = amount >= 2500000 ? "active_enterprise" : "active_pilot";

                const { error: updateError } = await supabaseAdmin
                    .from("organizations")
                    .update({ license_tier: licenseTier })
                    .eq("id", orgId);

                if (updateError) throw updateError;

                // Log Transaction
                await supabaseAdmin
                    .from("license_transactions")
                    .insert({
                        organization_id: orgId,
                        stripe_invoice_id: stripeInvoiceId,
                        amount: amount,
                        currency: currency
                    });
                
                console.log(`Provisioned ${licenseTier} license for Org ${orgId}`);
            } else {
                console.warn(`No organization found for customer email: ${customerEmail}`);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
        console.error(`Error processing webhook event:`, err.message);
        return new Response(`Error: ${err.message}`, { status: 500 });
    }
});
