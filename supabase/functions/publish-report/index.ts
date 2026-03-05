// @ts-nocheck — This file runs in Supabase's Deno runtime, not Node.js
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="https://esm.sh/jspdf@2.5.2"
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── PDF Generator ─────────────────────────────────────────────────────

function generatePdf(data: any): Uint8Array {
    const {
        organizationName, dateStr, baselineSlots, totalLoad,
        fiscalDrag, initiatives, analysis
    } = data;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    const utilizationPct = Math.round((totalLoad / baselineSlots) * 100);
    const inDeficit = totalLoad > baselineSlots;
    const formattedFiscalDrag = new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 0
    }).format(fiscalDrag);

    // ── Helper: Add Footer ──
    const addFooter = () => {
        const y = 285;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y - 5, pageW - margin, y - 5);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`${organizationName} — Strategic Capacity Assessment`, margin, y);
        doc.text(dateStr, pageW - margin, y, { align: "right" });
    };

    // ── Helper: Wrap Text ──
    const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number, fontSize: number): number => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        let y = startY;
        for (const line of lines) {
            if (y > 270) {
                doc.addPage();
                addFooter();
                y = 25;
            }
            doc.text(line, x, y);
            y += lineHeight;
        }
        return y;
    };

    // ── Helper: Section Header ──
    const addSectionHeader = (title: string, y: number): number => {
        if (y > 250) { doc.addPage(); addFooter(); y = 25; }
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text(title, margin, y);
        doc.setDrawColor(15, 23, 42);
        doc.line(margin, y + 3, pageW - margin, y + 3);
        return y + 12;
    };

    // ── Cover Page ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(241, 245, 249);
    doc.setFontSize(16);
    doc.text(organizationName, margin, 100);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.text("Strategic Capacity", margin, 125);
    doc.text("Assessment", margin, 140);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(12);
    doc.text(dateStr, margin, 160);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("ALTURAGOV", margin, 265);

    // ── Executive Summary ──
    doc.addPage();
    let y = addSectionHeader("Executive Summary", 30);

    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(`Operating at ${utilizationPct}% of Capacity`, margin, y);
    y += 14;

    doc.setFontSize(14);
    doc.text(`Current Load: ${totalLoad} Slots against a Baseline of ${baselineSlots} Slots.`, margin, y);
    y += 14;

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
        `Fiscal Note: Fiscal Drag identified: ${formattedFiscalDrag} currently committed to Tier 2 and Tier 3 initiatives — budget unavailable to Tier 1 priorities.`,
        margin, y, contentW, 5.5, 11
    );

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    y += 6;
    doc.text("Structural Diagnosis", margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const diagnosisText = inDeficit
        ? "Primary risk is structural delivery failure of Tier 1 and mandated programmes due to aggregate portfolio volume exceeding the organisation's capacity baseline."
        : "Primary risk is inefficient allocation of finite capacity to Tier 2 and Tier 3 initiatives at the expense of accelerating mandated programmes.";
    y = addWrappedText(diagnosisText, margin, y, contentW, 5.5, 11);

    y += 6;
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Overview of Findings", margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const overviewText = `Our analysis of the ${organizationName} portfolio demonstrates a capacity baseline of ${baselineSlots} Focus Slots. The current portfolio demands ${totalLoad} Focus Slots. ${inDeficit
        ? `This represents an overcommitment of ${totalLoad - baselineSlots} slots — a ${utilizationPct - 100}% structural deficit. At this loading, some programmes will fail. The only variable is which ones.`
        : "While the portfolio operates within theoretical capacity limits, the distribution of load across tiers indicates significant misalignment between delivery priority and resource allocation."
        } This assessment provides the factual and mathematical basis for governance decisions on portfolio composition.`;
    y = addWrappedText(overviewText, margin, y, contentW, 5.5, 11);

    addFooter();

    // ── Analytical Primer Page (NEW) ──
    doc.addPage();
    y = addSectionHeader("Analytical Primer: The Physics of Delivery", 30);

    const primerSections = [
        {
            title: "Focus Slots",
            body: "A calculated measure of the senior leadership attention and organisational capacity required to actively govern an initiative through to delivery. Each initiative's slot cost is derived from three vectors: the breadth of its stakeholder reach, the novelty of the work relative to the organisation's experience, and the depth of its dependencies on other active initiatives. A higher Focus Slot cost means the initiative demands a disproportionate share of the organisation's finite governance bandwidth."
        },
        {
            title: "Fiscal Drag",
            body: "The exact quantum of current-year budget committed to Tier 2 and Tier 3 initiatives — representing the share of financial capacity unavailable to Tier 1 priorities. Fiscal Drag does not measure waste; it measures misalignment between where money is committed and where delivery priority sits."
        },
        {
            title: "The Capacity Baseline",
            body: "The calculated maximum number of Focus Slots an organisation can sustain simultaneously before structural delivery failure becomes inevitable. Exceeding this threshold does not reduce the probability of success — it guarantees that some programmes will fail. The only variable is which ones."
        },
        {
            title: "Approval Mandate vs. Relative Priority",
            body: "Throughout this report, a distinction is drawn between an initiative's approval mandate — the political or governance authority under which it was sanctioned — and its relative priority, reflecting the organisation's current sequencing and resourcing intent. Cabinet or Ministerial approval carries significant accountability and reporting obligations. It does not, however, suspend the physics of delivery capacity. This report analyses both dimensions independently."
        }
    ];

    for (const section of primerSections) {
        if (y > 240) { doc.addPage(); addFooter(); y = 25; }
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(section.title, margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        y = addWrappedText(section.body, margin, y, contentW, 5, 10);
        y += 6;
    }

    addFooter();

    // ── Section 1: Capacity Baseline ──
    doc.addPage();
    y = addSectionHeader("Section 1: Your Capacity Baseline", 30);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
        "A Strategic Capacity Baseline is the maximum volume of concurrent strategic initiatives an organisation can sustain before rigorous delivery discipline collapses into reactive firefighting.",
        margin, y, contentW, 5.5, 11
    );

    // Big number
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y + 2, 80, 20, "F");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(`${baselineSlots} Total Focus Slots`, margin + 5, y + 16);

    y += 30;

    // ── Section 2: Portfolio Load ──
    y = addSectionHeader("Section 2: Your Current Portfolio Load", y);

    // Capacity vs Load boxes
    const boxW = contentW / 2 - 5;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, boxW, 25, "F");
    doc.rect(margin + boxW + 10, y, boxW, 25, "F");

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("BASELINE CAPACITY LIMIT", margin + 5, y + 8);
    doc.text("CURRENT PORTFOLIO LOAD", margin + boxW + 15, y + 8);

    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    doc.text(String(baselineSlots), margin + 5, y + 22);
    const statusColor = utilizationPct > 100 ? [220, 38, 38] : utilizationPct > 70 ? [217, 119, 6] : [22, 163, 74];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(String(totalLoad), margin + boxW + 15, y + 22);

    y += 35;

    // Initiative bars
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Initiative Breakdown (Sorted by Tier)", margin, y);
    y += 8;

    const getTierWeight = (p: string) => {
        if (p === "Tier 1") return 3;
        if (p === "Tier 2") return 2;
        if (p === "Tier 3") return 1;
        return 0;
    };

    const sorted = [...initiatives].sort((a: any, b: any) => {
        const wa = getTierWeight(a.priority);
        const wb = getTierWeight(b.priority);
        if (wa !== wb) return wb - wa;
        return b.cost - a.cost;
    });

    const maxBarVal = Math.max(baselineSlots, totalLoad, ...initiatives.map((i: any) => i.cost)) * 1.1;

    for (const init of sorted) {
        if (y > 265) { doc.addPage(); addFooter(); y = 25; }
        const barW = (init.cost / maxBarVal) * 100;
        const barColor = init.priority === "Tier 1" ? [15, 23, 42] : init.priority === "Tier 2" ? [217, 119, 6] : [100, 116, 139];

        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        const label = init.name.length > 35 ? init.name.substring(0, 35) + "..." : init.name;
        doc.text(label, margin, y + 4);

        doc.setFillColor(barColor[0], barColor[1], barColor[2]);
        doc.rect(margin + 65, y, barW, 6, "F");

        doc.setFontSize(8);
        doc.text(`${init.cost} S`, margin + 65 + barW + 3, y + 4);
        y += 9;
    }

    addFooter();

    // ── Section 3: Where Ambition Exceeds Capacity ──
    doc.addPage();
    y = addSectionHeader("Section 3: Where Ambition Exceeds Capacity", 30);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const cleanSection3 = (analysis.section3 || "").replace(/^#+\s+.*$/gm, "").trim();
    y = addWrappedText(cleanSection3, margin, y, contentW, 5.5, 11);

    addFooter();

    // ── Section 4: Courses of Action ──
    if (y > 200) { doc.addPage(); addFooter(); y = 25; } else { y += 8; }

    y = addSectionHeader("Section 4: Courses of Action", y);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const cleanSection4 = (analysis.section4 || "").replace(/^#+\s+.*$/gm, "").trim();
    y = addWrappedText(cleanSection4, margin, y, contentW, 5.5, 11);

    addFooter();

    // ── Section 5: Next Steps ──
    doc.addPage();
    y = addSectionHeader("Section 5: Recommended Next Steps", 30);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
        "Defensible governance requires action on these findings. Proceed with one of the following strategic pathways:",
        margin, y, contentW, 5.5, 11
    );

    const steps = [
        `1. Independent Re-sequencing. Use the data provided in Scenarios B and C to independently halt, suspend, or re-sequence the identified initiatives, bringing the portfolio within the Capacity Baseline.`,
        `2. Implement Enterprise Guardrails. Establish ongoing governance to permanently lock in recovered capacity and re-allocate the ${formattedFiscalDrag} of Fiscal Drag currently committed to Tier 2 and Tier 3 initiatives.`,
        `3. Formal Governance Review. Commission a structured executive-level review to interrogate these findings, confirm the trade-offs, and formally sign off the required portfolio adjustments.`,
    ];

    for (const step of steps) {
        y = addWrappedText(step, margin + 5, y + 4, contentW - 10, 5.5, 11);
    }

    // Appendix
    y += 10;
    if (y > 230) { doc.addPage(); addFooter(); y = 25; }
    y = addSectionHeader("Appendix: Methodology Note", y);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
        `The AlturaGov Strategic Capacity Methodology rests on the "Physics of Focus" framework. Each initiative's Focus Slot cost is derived from three fixed scalar factors: Stakeholder Friction (breadth of coordination required), Novelty & Tech (execution variance relative to organisational experience), and Dependency Depth (number of critical-path blockers). The Capacity Baseline represents the maximum concurrent Focus Slots an organisation can sustain before delivery discipline structurally degrades. Fiscal Drag is calculated as the sum of current-year budget committed to Tier 2 and Tier 3 initiatives — measuring the quantum of financial capacity unavailable to Tier 1 priorities.`,
        margin, y, contentW, 5.5, 11
    );

    addFooter();

    return new Uint8Array(doc.output("arraybuffer"));
}

// ── Main Handler ──────────────────────────────────────────────────────

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { email, data, analysis } = await req.json();
        if (!email || !data || !analysis) {
            return new Response(
                JSON.stringify({ error: "Email, data, and edited analysis are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch lead
        const { data: leads, error: leadError } = await supabase
            .from("leads")
            .select("*")
            .eq("email", email);

        if (leadError || !leads || leads.length === 0) {
            throw new Error("Lead not found.");
        }
        const lead = leads[0];

        // 2. Map initiatives for PDF
        const mappedInitiatives = data.portfolio.map((i: any, idx: number) => ({
            id: idx,
            name: i.initiative_name,
            cost: i.calculated_focus_slots,
            priority: i.relative_priority || i.priority_tier || "Unknown",
        }));

        const dateStr = new Date().toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric"
        });

        console.log(`[PUBLISHER] Generating PDF for ${data.organisation_name}...`);

        // 3. Generate PDF
        const pdfBytes = generatePdf({
            organizationName: data.organisation_name,
            dateStr,
            baselineSlots: data.calculated_capacity_baseline,
            totalLoad: data.total_current_load,
            fiscalDrag: data.fiscal_drag || 0,
            initiatives: mappedInitiatives,
            analysis,
        });

        console.log(`[PUBLISHER] PDF generated (${pdfBytes.length} bytes). Uploading...`);

        // 4. Upload to Supabase Storage
        const reportFileName = `${email.replace("@", "_at_")}_Strategic_Audit_Report.pdf`;
        const { error: uploadError } = await supabase.storage
            .from("audit_reports")
            .upload(reportFileName, pdfBytes, {
                contentType: "application/pdf",
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Failed to upload PDF: ${uploadError.message}`);
        }

        // 5. Update lead status
        await supabase
            .from("leads")
            .update({ audit_status: "report_delivered", report_url: reportFileName })
            .eq("id", lead.id);

        console.log(`[PUBLISHER] Report published: ${reportFileName}`);

        return new Response(
            JSON.stringify({ success: true, message: "Report published", reportUrl: reportFileName }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("[PUBLISHER ERROR]", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
