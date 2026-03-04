import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.177.0/csv/mod.ts";
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

    // ── Cover Page ──
    doc.setFillColor(15, 23, 42); // Navy
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

    // ── Executive Summary ──
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text("Executive Summary", margin, 30);
    doc.setDrawColor(15, 23, 42);
    doc.line(margin, 33, pageW - margin, 33);

    doc.setFontSize(20);
    doc.text(`Operating at ${utilizationPct}% of Capacity`, margin, 50);

    doc.setFontSize(14);
    doc.text(`Current Load: ${totalLoad} Slots against a Baseline of ${baselineSlots} Slots.`, margin, 62);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    let y = addWrappedText(
        `Fiscal Note: Fiscal Drag identified: ${formattedFiscalDrag} currently allocated to non-strategic initiatives.`,
        margin, 78, contentW, 5.5, 11
    );

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    y = addWrappedText("Structural Diagnosis", margin, y + 8, contentW, 6, 14);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const diagnosisText = inDeficit
        ? "Primary risk is structural delivery failure of Ministerial priorities due to volume."
        : "Primary risk is inefficient allocation of resources to low-complexity/low-value activity.";
    y = addWrappedText(diagnosisText, margin, y + 2, contentW, 5.5, 11);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    y = addWrappedText("Overview of Findings", margin, y + 8, contentW, 6, 14);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const overviewText = `Our analysis of the ${organizationName} portfolio demonstrates a capacity baseline of ${baselineSlots} slots. However, your current portfolio demands ${totalLoad} slots. ${inDeficit
        ? `This results in an overcommitment of ${totalLoad - baselineSlots} slots. This over-saturation creates a bottleneck that endangers high-priority initiatives, drastically increasing the likelihood of technical debt and delivery delays.`
        : "While you are operating within your theoretical limits, there remains a need to review low-priority initiatives ensuring resources are perfectly aligned with strategic value."
        } This assessment uncovers the tangible operational weight of your active initiatives and provides clear, actionable scenarios to either correct structural deficits or optimize existing capacity allocation.`;
    y = addWrappedText(overviewText, margin, y + 2, contentW, 5.5, 11);

    addFooter();

    // ── Section 1 & 2: Baseline and Portfolio Load ──
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text("Section 1: Your Capacity Baseline", margin, 30);
    doc.line(margin, 33, pageW - margin, 33);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
        "A Strategic Capacity Baseline is the maximum volume of concurrent strategic initiatives an organisation can sustain before rigorous delivery discipline collapses into reactive firefighting.",
        margin, 42, contentW, 5.5, 11
    );

    // Big number
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y + 2, 80, 20, "F");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(`${baselineSlots} Total Focus Slots`, margin + 5, y + 16);

    y += 30;
    doc.setFontSize(18);
    doc.text("Section 2: Your Current Portfolio Load", margin, y);
    doc.line(margin, y + 3, pageW - margin, y + 3);
    y += 12;

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
    doc.text("Initiative Breakdown (Sorted by Priority)", margin, y);
    y += 8;

    const getPriorityWeight = (p: string) => {
        const lf = (p || "").toLowerCase();
        if (lf.includes("ministerial")) return 4;
        if (lf.includes("high")) return 3;
        if (lf.includes("medium")) return 2;
        if (lf.includes("low")) return 1;
        return 0;
    };

    const sorted = [...initiatives].sort((a: any, b: any) => {
        const wa = getPriorityWeight(a.priority);
        const wb = getPriorityWeight(b.priority);
        if (wa !== wb) return wb - wa;
        return b.cost - a.cost;
    });

    const maxBarVal = Math.max(baselineSlots, totalLoad, ...initiatives.map((i: any) => i.cost)) * 1.1;

    for (const init of sorted) {
        if (y > 265) {
            doc.addPage();
            addFooter();
            y = 25;
        }
        const barW = (init.cost / maxBarVal) * 100;
        const barColor = init.cost >= 5 ? [220, 38, 38] : init.cost >= 3 ? [217, 119, 6] : [100, 116, 139];

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

    // ── Section 3 & 4: AI Analysis ──
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text("Section 3: Where Your Strategy is Exposed", margin, 30);
    doc.line(margin, 33, pageW - margin, 33);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    // Strip markdown headers for PDF rendering
    const cleanSection3 = (analysis.section3 || "").replace(/^#+\s+.*$/gm, "").trim();
    y = addWrappedText(cleanSection3, margin, 42, contentW, 5.5, 11);

    if (y > 200) {
        doc.addPage();
        addFooter();
        y = 25;
    }

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("Section 4: Trade-Off Scenarios", margin, y + 10);
    doc.line(margin, y + 13, pageW - margin, y + 13);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const cleanSection4 = (analysis.section4 || "").replace(/^#+\s+.*$/gm, "").trim();
    y = addWrappedText(cleanSection4, margin, y + 22, contentW, 5.5, 11);

    addFooter();

    // ── Section 5: Next Steps ──
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text("Section 5: Recommended Next Steps", margin, 30);
    doc.line(margin, 33, pageW - margin, 33);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
        "Defensible governance requires action on these findings. Proceed with one of the following strategic pathways:",
        margin, 42, contentW, 5.5, 11
    );

    const steps = [
        `1. Independent Rationalisation. Use the data provided in Scenario B to independently halt or pause the identified low-value initiatives, bringing your portfolio back within Baseline constraints.`,
        `2. Implement Enterprise Guardrails. Establish ongoing governance to permanently lock in recovered capacity and re-allocate the ${formattedFiscalDrag} currently lost to drift.`,
        `3. Deep-Dive Follow-Up. Schedule a tailored, executive-level workshop to interrogate these figures and formally sign off on the required portfolio trade-offs.`,
    ];

    for (const step of steps) {
        y = addWrappedText(step, margin + 5, y + 4, contentW - 10, 5.5, 11);
    }

    // Appendix
    y += 10;
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    if (y > 230) { doc.addPage(); addFooter(); y = 25; }
    doc.text("Appendix: Methodology Note", margin, y);
    doc.line(margin, y + 3, pageW - margin, y + 3);

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    y = addWrappedText(
        `The AlturaGov Strategic Capacity Methodology rests on the "Physics of Focus" framework. To establish a quantifiable measure of delivery drag, we calculate an initiative's "Focus Slots." Instead of relying on abstract budget or FTE metrics that obscure real cognitive load, the complexity of any given strategic initiative is calculated across three fixed scalar factors: Stakeholder Friction, Novelty & Tech, and Dependency Depth.`,
        margin, y + 10, contentW, 5.5, 11
    );

    addFooter();

    // Output as Uint8Array
    return new Uint8Array(doc.output("arraybuffer"));
}

// ── Portfolio Parser (same as generate-draft) ─────────────────────────

function parsePortfolio(csvString: string, lead: any) {
    const rows = parse(csvString, { skipFirstRow: true });

    let fiscalDrag = 0;
    const initiatives = rows.map((row: any, index: number) => {
        const name = row["initiative_name"] || row["Name"] || `Initiative ${index + 1}`;
        const stake = parseInt(row["complexity_stakeholders_1_to_3"] || "1", 10);
        const tech = parseInt(row["complexity_novelty_1_to_3"] || "1", 10);
        const dep = parseInt(row["complexity_dependency_1_to_3"] || "1", 10);

        let cost = Math.ceil((stake + tech + dep) / 1.5);
        if (cost < 1) cost = 1;
        if (cost > 6) cost = 6;

        let budget = 0;
        const rawBudget = row["current_fy_budget"] || "0";
        const parsedBudget = parseInt(String(rawBudget).replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsedBudget)) budget = parsedBudget;

        const priority = row["priority_tier"] || "Standard";
        if (priority === "Low" || priority === "Medium") fiscalDrag += budget;

        return {
            name,
            cost,
            priority,
            id: index,
        };
    });

    const totalLoad = initiatives.reduce((sum: number, init: any) => sum + init.cost, 0);

    let parsedBaseline = 5;
    if (lead.portfolio_scale) {
        if (lead.portfolio_scale.includes("11-25")) parsedBaseline = 15;
        else if (lead.portfolio_scale.includes("26-50")) parsedBaseline = 25;
        else if (lead.portfolio_scale.includes("50+")) parsedBaseline = 40;
    }

    return {
        organizationName: lead.organization_name || "Public Sector Organisation",
        baselineSlots: parsedBaseline,
        totalLoad,
        fiscalDrag,
        initiatives,
    };
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

        // 1. Fetch lead to get lead.id
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
            priority: i.priority_tier,
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
