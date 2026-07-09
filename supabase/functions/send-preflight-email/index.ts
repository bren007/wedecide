// @ts-nocheck — This file runs in Supabase's Deno runtime, not Node.js
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
        const { email, organizationName } = await req.json();
        console.log(`📩 Request to send email to: ${email}`);

        if (!email) {
            console.error("❌ Missing email parameter in request");
            throw new Error("Missing email parameter");
        }

        const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
        console.log(`📤 Sending via Resend. From: ${fromEmail}, API Key Set: ${!!resendApiKey}`);

        if (!resendApiKey) {
            console.warn("RESEND_API_KEY not set. Mocking email send logic to:", email);
            return new Response(JSON.stringify({
                message: "Mocked email sent successfully. (Provide RESEND_API_KEY environment variable to enable live emails)",
                sentTo: email
            }), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
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
                from: Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev",
                to: email,
                subject: "Your Strategic Capacity Audit — Preparing for Your Slot-Sync Session",
                html: `
                    <p>Your Strategic Capacity Audit is confirmed — and the work begins now.</p>
                    <p>The quality of your assessment depends on one thing: a clear picture of your current portfolio load. To ensure our Slot-Sync Session is grounded in your organisation's reality rather than assumptions, we need your initiative backlog before we meet.</p>
                    <p>Please have your PMO or Secretariat extract your current portfolio list (CSV or Excel) and submit it via our secure portal.</p>
                    <p><strong>Upload Portal:</strong> <a href="https://alturagov.com/secure-drop">https://alturagov.com/secure-drop</a></p>
                    <p><strong>Deadline:</strong> At least 48 hours before your scheduled session.</p>
                    <p>We've kept the preparation requirements as lean as possible. The redaction guidelines below should take your team no more than 30 minutes to apply.</p>
                    <br/>
                    <h3>Data Minimisation & Security</h3>
                    <p>As agreed in the Mutual NDA (attached for your records), AlturaGov does not require — and actively requests you remove — sensitive identifiers before upload. Please ensure your team applies the following redactions:</p>
                    <ul>
                        <li>Remove all individual staff names (use roles and titles only).</li>
                        <li>Round all financial figures to the nearest $10k.</li>
                        <li>Redact specific vendor contract IDs, security classifications, or politically sensitive programme descriptions.</li>
                    </ul>
                    <p>We do not need to know <em>who</em> is doing the work; we only need to measure the <em>load</em> of the work.</p>
                    <p>Your raw data file is deleted from our systems once your Strategic Capacity Report is generated. This is standard practice, consistent with the terms of the Mutual NDA.</p>
                    <p>Once your file is submitted, we'll begin AI ingestion and baseline mapping ahead of our session. You don't need to prepare anything further — the Slot-Sync Session is where we work through the findings together.</p>
                    <br/>
                    <p>Regards,<br/>Lead Strategist, AlturaGov</p>
                `
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            console.error(`❌ Resend API Error: ${res.status}`, errBody);
            throw new Error(`Resend API error: ${res.status} ${errBody}`);
        }

        const responseData = await res.json();
        console.log("✅ Resend success response:", responseData);

        return new Response(JSON.stringify({ message: "Email sent successfully", data: responseData }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            status: 200,
        });

    } catch (err: unknown) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            status: 400,
        });
    }
});
