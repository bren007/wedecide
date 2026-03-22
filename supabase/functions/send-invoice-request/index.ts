import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const ADMIN_EMAIL = 'support@alturagov.com';
const FROM_EMAIL = 'audit@alturagov.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface InvoiceRequest {
  full_name: string;
  work_email: string;
  phone: string;
  agency: string;
  selected_tier: string;
  po_number?: string;
  notes?: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error: ${res.status} — ${body}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: InvoiceRequest = await req.json();

    // 1. Write to Supabase invoice_requests table
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: row, error: dbError } = await supabase
      .from('invoice_requests')
      .insert({
        full_name: body.full_name,
        work_email: body.work_email,
        phone: body.phone,
        agency: body.agency,
        selected_tier: body.selected_tier,
        po_number: body.po_number || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);

    const supabaseRowUrl = `${SUPABASE_URL.replace('.supabase.co', '')}/dashboard/project/${SUPABASE_URL.split('.')[0].split('//')[1]}/editor/public/invoice_requests?filter=id%3Aeq%3A${row.id}`;

    // 2. Admin notification email
    const adminHtml = `
      <h2>New Invoice Request — AlturaGov</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Name</td><td style="padding:8px;border:1px solid #e2e8f0;">${body.full_name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Work Email</td><td style="padding:8px;border:1px solid #e2e8f0;">${body.work_email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Direct Phone</td><td style="padding:8px;border:1px solid #e2e8f0;">${body.phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Agency</td><td style="padding:8px;border:1px solid #e2e8f0;">${body.agency}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Tier</td><td style="padding:8px;border:1px solid #e2e8f0;">${body.selected_tier}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">PO Number</td><td style="padding:8px;border:1px solid #e2e8f0;">${body.po_number || '—'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Notes</td><td style="padding:8px;border:1px solid #e2e8f0;">${body.notes || '—'}</td></tr>
      </table>
      <p style="margin-top:16px;"><strong>Action:</strong> Issue invoice within 1 business day.</p>
    `;

    // 3. Requester confirmation email
    const requesterHtml = `
      <div style="font-family:sans-serif;font-size:14px;color:#334155;max-width:560px;">
        <h2 style="color:#1e293b;">Invoice request received.</h2>
        <p>Thank you, ${body.full_name}.</p>
        <p>You will receive a GST-compliant NZ tax invoice at <strong>${body.work_email}</strong> within one business day.</p>
        ${body.po_number ? `<p>Your PO number (<strong>${body.po_number}</strong>) will be referenced on the invoice.</p>` : ''}
        <p>The invoice will include bank transfer payment details. Access to your Command Centre activates automatically upon payment confirmation.</p>
        <p>If you have a deadline or specific procurement requirements, reply directly to the invoice email.</p>
        <hr style="margin:24px 0;border-color:#e2e8f0;" />
        <p style="color:#94a3b8;font-size:12px;">AlturaGov · support@alturagov.com · New Zealand</p>
      </div>
    `;

    await Promise.all([
      sendEmail(ADMIN_EMAIL, `New Invoice Request — ${body.agency} · ${body.selected_tier}`, adminHtml),
      sendEmail(body.work_email, 'Your AlturaGov invoice request has been received', requesterHtml),
    ]);

    return new Response(JSON.stringify({ success: true, id: row.id }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('send-invoice-request error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
