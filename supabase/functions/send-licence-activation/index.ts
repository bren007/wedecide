// @ts-nocheck — This file runs in Supabase's Deno runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    try {
        const { email, organizationName, tier } = await req.json();
        console.log(`📩 Request to send activation email to: ${email}`);

        if (!email) {
            throw new Error("Missing email parameter");
        }

        const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
        console.log(`📤 Sending via Resend. From: ${fromEmail}, API Key Set: ${!!resendApiKey}`);

        if (!resendApiKey) {
            console.warn("RESEND_API_KEY not set. Mocking email send logic to:", email);
            return new Response(JSON.stringify({
                message: "Mocked email sent successfully.",
                sentTo: email
            }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                status: 200,
            });
        }

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: fromEmail,
                to: email,
                subject: "Your AlturaGov Command Centre is Active",
                html: `
                    <h2>Welcome to AlturaGov</h2>
                    <p>Good news — your recent invoice has been processed and your organisation's (${organizationName}) AlturaGov instance has been upgraded to the <strong>${tier.toUpperCase()}</strong> tier.</p>
                    <p>Your Command Centre is now fully active.</p>
                    <p>To get started:</p>
                    <ul>
                        <li><a href="https://app.alturagov.com/login">Log into your Command Centre</a></li>
                        <li>Invite your core executive team (Chairs and Secretaries).</li>
                        <li>Begin importing or proposing your first strategic initiatives.</li>
                    </ul>
                    <p>If you have any questions or require administrative assistance, please don't hesitate to reach out to our support team.</p>
                    <br/>
                    <p>Regards,<br/>The AlturaGov Team</p>
                `
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Resend API error: ${res.status} ${errBody}`);
        }

        const responseData = await res.json();
        return new Response(JSON.stringify({ message: "Email sent successfully", data: responseData }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            status: 200,
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            status: 400,
        });
    }
});
