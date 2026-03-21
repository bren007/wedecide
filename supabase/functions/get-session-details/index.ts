// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders, status: 200 });
    }

    try {
        const url = new URL(req.url);
        const session_id = url.searchParams.get("session_id");

        if (!session_id) {
            throw new Error("Missing session_id");
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        return new Response(JSON.stringify({
            customer_email: session.customer_details?.email,
            customer_name: session.customer_details?.name,
            calendly_url: Deno.env.get("CALENDLY_EVENT_URL") || "https://calendly.com/alturagov/executive-slot-sync"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
