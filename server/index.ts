import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { generateAnalysis } from './aiAnalyzer.js';
import { generatePdfBuffer } from './pdfGenerator.js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY!;
const ANTHROPIC_API_KEY = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || GEMINI_API_KEY; // fallback so it doesn't crash if not provided during testing

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to structure the portfolio
const parseAndStructurePortfolio = async (email: string, token: string) => {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: { headers: { Authorization: token } }
    });

    // 1. Fetch Lead Data
    const { data: leads, error: leadError } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('email', email);

    if (leadError || !leads || leads.length === 0) {
        console.error('Lead lookup error:', leadError, 'Leads array:', leads);
        throw new Error('Lead not found or error fetching lead.');
    }

    const lead = leads[0];
    if (!lead.file_url) {
        console.error('No dataset uploaded lead obj:', lead);
        throw new Error('No dataset uploaded for this lead.');
    }

    // 2. Fetch CSV
    const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('audit_uploads')
        .download(lead.file_url);

    if (downloadError || !fileData) {
        console.error('Download error trace:', downloadError);
        throw new Error(`Failed to download portfolio dataset: ${downloadError?.message || downloadError}`);
    }

    const csvString = await fileData.text();
    const parsedCsv = Papa.parse(csvString, { header: true, skipEmptyLines: true });

    // Parse initiatives
    let fiscalDrag = 0;
    const initiativeMap = new Map<string, any>();

    const initiatives = parsedCsv.data.map((row: any, index: number) => {
        const name = row['initiative_name'] || row['Name'] || row['Project'] || `Initiative ${index + 1}`;
        const stake = parseInt(row['complexity_stakeholders_1_to_3'] || '1', 10);
        const tech = parseInt(row['complexity_novelty_1_to_3'] || '1', 10);
        const dep = parseInt(row['complexity_dependency_1_to_3'] || '1', 10);

        let cost = Math.ceil((stake + tech + dep) / 1.5);
        if (cost < 1) cost = 1;
        if (cost > 6) cost = 6;

        let budget = 0;
        const rawBudget = row['current_fy_budget'] || '0';
        const parsedBudget = parseInt(String(rawBudget).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsedBudget)) {
            budget = parsedBudget;
        }

        const priority = row['priority_tier'] || 'Standard';
        if (priority === 'Low' || priority === 'Medium') {
            fiscalDrag += budget;
        }

        const blockersStr = row['dependency_blockers'] || '';
        const blockers = blockersStr.split(',').map((b: string) => b.trim()).filter(Boolean);

        const initObj = {
            initiative_name: name,
            alignment_pillar: row['strategic_pillar'] || 'Uncategorised',
            calculated_focus_slots: cost,
            fiscal_tail_impact: budget,
            priority_tier: priority,
            blockers: blockers,
            lifecycle_stage: row['lifecycle_stage'] || '',
            start_date: row['start_date'] // optional column if user added it
        };
        initiativeMap.set(name, initObj);
        return initObj;
    });

    // 2nd pass: Dependencies and Zombies
    const dependencyRiskList: any[] = [];
    const zombieProjects: string[] = [];
    const now = new Date();

    initiatives.forEach(init => {
        if (init.priority_tier.includes('Ministerial') || init.priority_tier === 'High') {
            init.blockers.forEach((b: string) => {
                const blockerInit = initiativeMap.get(b);
                if (blockerInit && (blockerInit.priority_tier === 'Low' || blockerInit.priority_tier === 'Medium')) {
                    dependencyRiskList.push({
                        high_priority_initiative: init.initiative_name,
                        blocked_by: blockerInit.initiative_name,
                        blocker_priority: blockerInit.priority_tier
                    });
                }
            });
        }

        if (init.lifecycle_stage.toLowerCase().includes('active') || init.lifecycle_stage.toLowerCase().includes('progress') || init.lifecycle_stage.toLowerCase().includes('flight')) {
            if (init.calculated_focus_slots <= 2 && init.start_date) {
                const sDate = new Date(init.start_date);
                if (!isNaN(sDate.getTime())) {
                    const diffDays = (now.getTime() - sDate.getTime()) / (1000 * 3600 * 24);
                    if (diffDays > 365) {
                        zombieProjects.push(init.initiative_name);
                    }
                }
            }
        }
    });

    const totalLoad = initiatives.reduce((sum, init) => sum + init.calculated_focus_slots, 0);

    // 3. Capacity Baseline from calibration (unified formula)
    // Falls back to values from lead record, or defaults if not present
    const largeSteerable = parseInt(lead.calibration_large_steerable, 10) || 2;
    const historicalAvg = parseInt(lead.calibration_historical_avg, 10) || 8;
    const capacityBaseline = (largeSteerable * 5) + (Math.max(0, historicalAvg - largeSteerable) * 3);

    return {
        lead,
        payload: {
            organisation_name: lead.organization_name || 'Public Sector Organisation',
            calculated_capacity_baseline: capacityBaseline,
            total_current_load: totalLoad,
            overcommitment_pct: capacityBaseline > 0 ? Math.round(((totalLoad - capacityBaseline) / capacityBaseline) * 100) : 0,
            absolute_slot_deficit: Math.max(0, totalLoad - capacityBaseline),
            fiscal_drag: fiscalDrag,
            dependency_risk_list: dependencyRiskList,
            zombie_projects: zombieProjects,
            portfolio: initiatives,
            calibration: {
                large_steerable: largeSteerable,
                historical_avg: historicalAvg,
            },
        }
    };
};

// ENDPOINT 1: Create a draft (Human-in-the-loop review)
app.post('/api/generate-draft', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        console.log(`[DRAFT GENERATOR] Parsing portfolio for ${email}`);
        const token = req.headers.authorization || '';

        console.log(`[DRAFT GENERATOR] Token Received length: ${token.length}`);

        if (!token) {
            console.warn('[DRAFT GENERATOR] Warning: No authorization token received from frontend!');
        }

        const { payload } = await parseAndStructurePortfolio(email, token);

        console.log(`[DRAFT GENERATOR] Running LLM inference`);
        const analysisTokens = await generateAnalysis(GEMINI_API_KEY, ANTHROPIC_API_KEY, payload);

        res.status(200).json({
            success: true,
            data: payload,
            analysis: analysisTokens
        });

    } catch (error: any) {
        console.error('[DRAFT GENERATOR SYSTEM ERROR]', error.stack || error.message || error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// ENDPOINT 2: Publish the final edited report
app.post('/api/publish-report', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, data, analysis } = req.body;
        if (!email || !data || !analysis) {
            return res.status(400).json({ error: 'Email, data, and edited analysis are required' });
        }

        const token = req.headers.authorization || '';
        const { lead } = await parseAndStructurePortfolio(email, token); // Or you could just use 'data' from request directly, but we need lead.id, lead.organization_name anyway.

        // Re-map portfolio schema slightly for the react-pdf generator since it expects { name, cost, id, priority }
        // We'll map the payload back into the structure `pdfGenerator` expects
        const mappedInitiatives = data.portfolio.map((i: any, idx: number) => ({
            id: idx,
            name: i.initiative_name,
            cost: i.calculated_focus_slots,
            priority: i.priority_tier
        }));

        console.log(`[PUBLISHER] Generating PDF for ${data.organisation_name}...`);

        const pdfBuffer = await generatePdfBuffer({
            organizationName: data.organisation_name,
            dateStr: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            baselineSlots: data.calculated_capacity_baseline,
            totalLoad: data.total_current_load,
            fiscalDrag: data.fiscal_drag || 0,
            initiatives: mappedInitiatives,
            analysis: analysis
        });

        console.log(`[PUBLISHER] React-PDF generated (${pdfBuffer.length} bytes). Uploading...`);

        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, { global: { headers: { Authorization: token } } });

        const reportFileName = `${email.replace('@', '_at_')}_Strategic_Audit_Report.pdf`;
        const { error: uploadError } = await supabaseClient.storage
            .from('audit_reports')
            .upload(reportFileName, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Failed to upload generated PDF report: ${uploadError.message}`);
        }

        await supabaseClient
            .from('leads')
            .update({
                audit_status: 'report_delivered',
                report_url: reportFileName
            })
            .eq('id', lead.id);

        console.log(`[PUBLISHER] Report published successfully: ${reportFileName}`);

        res.status(200).json({
            success: true,
            message: 'Report published successfully',
            reportUrl: reportFileName
        });

    } catch (error: any) {
        console.error('[PUBLISHER ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`[ALTURAGOV SERVER] Running on port ${PORT}`);
});
