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
        const { purchaser_email } = await req.json();

        if (!purchaser_email) {
            throw new Error("Missing purchaser_email");
        }

        const origin = req.headers.get("origin");

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "nzd",
                        product_data: {
                            name: "Strategic Capacity Audit & Executive Slot-Sync",
                            description: "Comprehensive diagnostic of organizational capacity and strategic alignment.",
                        },
                        unit_amount: 195000, // $1,950.00
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            customer_email: purchaser_email,
            metadata: {
                purchaser_email: purchaser_email,
            },
            success_url: `${origin}/audit-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/audit`,
        });

        return new Response(JSON.stringify({ url: session.url, id: session.id }), {
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
