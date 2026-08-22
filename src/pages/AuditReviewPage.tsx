import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { ShieldCheck, FileText, Loader2, Send, Download, AlertTriangle, Calculator, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToasts } from '../context/ToastContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type Lead = Database['public']['Tables']['leads']['Row'];

const getCleanErrorMessage = (err: unknown): string => {
    if (!err) return 'An unexpected error occurred.';
    let message = '';
    if (err instanceof Error) {
        message = err.message;
    } else if (typeof err === 'object' && err !== null && 'message' in err) {
        message = String((err as { message: unknown }).message);
    } else {
        message = String(err);
    }

    if (message.includes('violates unique constraint') || message.includes('duplicate key')) {
        return 'A record with this information already exists.';
    }
    if (message.includes('relation') && message.includes('does not exist')) {
        return 'Database service temporary misalignment. Please contact support.';
    }
    if (message.includes('column') && message.includes('does not exist')) {
        return 'Schema cache mismatch. Please reload and try again.';
    }
    if (message.includes('JWT') || message.includes('token') || message.includes('invalid claims') || message.includes('Auth')) {
        return 'Authentication session expired or invalid. Please sign in again.';
    }
    
    const sqlKeywords = ['select', 'insert', 'update', 'delete', 'where', 'foreign key', 'constraint', 'null value in column', 'pg_tblspc'];
    const lowerMessage = message.toLowerCase();
    if (sqlKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'A database error occurred. Please contact support.';
    }

    if (message.length > 150) {
        return message.substring(0, 150) + '...';
    }

    return message;
};

const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};


export const AuditReviewPage: React.FC = () => {
    useAuth();
    const { showToast } = useToasts();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(false);
    const [draftData, setDraftData] = useState< unknown >(null);
    const [draftAnalysis, setDraftAnalysis] = useState<{ section3: string, section4: string, internal_critique?: string } | null>(null);
    const [publishing, setPublishing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Calibration state
    const [calibrationLargeSteerable, setCalibrationLargeSteerable] = useState<string>('');
    const [calibrationHistoricalAvg, setCalibrationHistoricalAvg] = useState<string>('');
    const [frictionCoefficient, setFrictionCoefficient] = useState<string>('1.00');
    const [calibrationSaving, setCalibrationSaving] = useState(false);

    const fetchLeads = useCallback(async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .in('audit_status', ['data_uploaded', 'draft_generated', 'report_delivered', 'data_received', 'report_generated'])
            .order('created_at', { ascending: true });
        console.log('Fetched leads:', data);
        if (!error) {
            setLeads(data || []);
            setInitialLoading(false);
        } else {
            console.error('Error fetching leads:', error);
            showToast('Failed to load audit queue.', 'error');
            setInitialLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]); // Include fetchLeads dependency

    // When lead is selected, populate calibration fields from DB
    useEffect(() => {
        if (selectedLead) {
            setCalibrationLargeSteerable(
                (selectedLead as unknown).calibration_large_steerable != null
                    ? String((selectedLead as unknown).calibration_large_steerable)
                    : ''
            );
            setCalibrationHistoricalAvg(
                (selectedLead as unknown).calibration_historical_avg != null
                    ? String((selectedLead as unknown).calibration_historical_avg)
                    : ''
            );
            setFrictionCoefficient(
                (selectedLead as unknown).friction_coefficient != null
                    ? String((selectedLead as unknown).friction_coefficient)
                    : '1.00'
            );
            const savedDraftData = localStorage.getItem(`draftData_${selectedLead.id}`);
            const savedDraftAnalysis = localStorage.getItem(`draftAnalysis_${selectedLead.id}`);
            if (savedDraftData && savedDraftAnalysis) {
                try {
                    setDraftData(JSON.parse(savedDraftData));
                    setDraftAnalysis(JSON.parse(savedDraftAnalysis));
                } catch {
                    setDraftData(null);
                    setDraftAnalysis(null);
                }
            } else {
                setDraftData(null);
                setDraftAnalysis(null);
            }
            setSuccessMsg('');
        }
    }, [selectedLead]);

    // Derived calibration values
    const largeSteerable = parseInt(calibrationLargeSteerable, 10);
    const historicalAvg = parseInt(calibrationHistoricalAvg, 10);
    const frictionVal = parseFloat(frictionCoefficient);
    const isCalibrationValid = !isNaN(largeSteerable) && largeSteerable > 0 && !isNaN(historicalAvg) && historicalAvg > 0 && !isNaN(frictionVal) && frictionVal >= 1.0 && frictionVal <= 2.5;
    const nominalBaseline = isCalibrationValid
        ? (largeSteerable * 5) + (Math.max(0, historicalAvg - largeSteerable) * 3)
        : 0;
    const calculatedBaseline = isCalibrationValid && frictionVal > 0 
        ? Math.round(nominalBaseline / frictionVal) 
        : 0;

    const handleSaveCalibration = async () => {
        if (!selectedLead || !isCalibrationValid) return;
        setCalibrationSaving(true);
        // Clamp Fm to [1.00, 2.50] before writing — matches DB CHECK constraint
        const clampedFm = Math.min(2.50, Math.max(1.00, frictionVal));
        try {
            const { error } = await supabase
                .from('leads')
                .update({
                    calibration_large_steerable: largeSteerable,
                    calibration_historical_avg: historicalAvg,
                    friction_coefficient: clampedFm,
                } as unknown)
                .eq('id', selectedLead.id);

            if (error) throw error;

            // Update local state
            const updatedLead = { ...selectedLead, calibration_large_steerable: largeSteerable, calibration_historical_avg: historicalAvg, friction_coefficient: clampedFm } as unknown;
            setSelectedLead(updatedLead);
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
            showToast('Calibration saved.', 'success');
        } catch (e: unknown) {
            console.error('Failed to save calibration:', e);
            const errMsg = getCleanErrorMessage(e);
            showToast('Failed to save calibration: ' + errMsg, 'error');
        } finally {
            setCalibrationSaving(false);
        }
    };

    const handleGenerateDraft = async () => {
        if (!selectedLead || !isCalibrationValid) return;
        setLoading(true);
        setDraftData(null);
        setDraftAnalysis(null);
        setSuccessMsg('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-draft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    email: selectedLead.email,
                    calibration_large_steerable: largeSteerable,
                    calibration_historical_avg: historicalAvg,
                    friction_coefficient: frictionVal,
                    primary_pain_point: (selectedLead as unknown).primary_pain_point || null,
                })
            });

            const json = await res.json();
            if (!json.success) {
                throw new Error(json.error || 'Failed to generate draft.');
            }

            setDraftData(json.data);
            setDraftAnalysis(json.analysis);
            localStorage.setItem(`draftData_${selectedLead.id}`, JSON.stringify(json.data));
            localStorage.setItem(`draftAnalysis_${selectedLead.id}`, JSON.stringify(json.analysis));
        } catch (e: unknown) {
            console.error('Draft generation error:', e);
            const errMsg = getCleanErrorMessage(e);
            showToast(errMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedLead || !draftData || !draftAnalysis || !isCalibrationValid) return;
        
        const pdfWindow = window.open('', '_blank');
        if (pdfWindow) {
            pdfWindow.document.write('<div style="font-family: sans-serif; padding: 20px; color: #334155;">Generating and publishing PDF report. Please wait...</div>');
        }

        setPublishing(true);
        setSuccessMsg('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch(`${SUPABASE_URL}/functions/v1/publish-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({
                    email: selectedLead.email,
                    data: draftData,
                    analysis: draftAnalysis,
                    calibration_large_steerable: largeSteerable,
                    calibration_historical_avg: historicalAvg,
                    friction_coefficient: frictionVal,
                    capacity_baseline: calculatedBaseline,
                })
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to publish.');

            setSuccessMsg('Report successfully published and linked to the lead profile.');
            fetchLeads();

            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, audit_status: 'report_delivered', report_url: json.reportUrl } : l));
            setSelectedLead(prev => prev ? { ...prev, audit_status: 'report_delivered', report_url: json.reportUrl } as unknown : null);
            localStorage.removeItem(`draftData_${selectedLead.id}`);
            localStorage.removeItem(`draftAnalysis_${selectedLead.id}`);
            showToast('Report generated successfully!', 'success');

            const { data: signedData } = await supabase.storage.from('audit_reports').createSignedUrl(json.reportUrl, 3600);
            if (signedData) {
                let finalUrl = signedData.signedUrl;
                if (!finalUrl.startsWith('http')) {
                    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const storagePath = finalUrl.startsWith('/storage/v1') ? '' : '/storage/v1';
                    finalUrl = `${baseUrl}${storagePath}${finalUrl}`;
                }
                if (pdfWindow) {
                    pdfWindow.location.href = finalUrl;
                } else {
                    window.open(finalUrl, '_blank');
                }
            } else if (pdfWindow) {
                pdfWindow.document.write('<div style="color: red;">Failed to generate viewer link.</div>');
            }
        } catch (e: unknown) {
            console.error('Publish error:', e);
            const errMsg = getCleanErrorMessage(e);
            if (pdfWindow) {
                try {
                    pdfWindow.document.body.innerHTML = '';
                    const errDiv = pdfWindow.document.createElement('div');
                    errDiv.style.color = 'red';
                    errDiv.style.fontFamily = 'sans-serif';
                    errDiv.style.padding = '20px';
                    errDiv.textContent = `Failed to publish: ${errMsg}`;
                    pdfWindow.document.body.appendChild(errDiv);
                } catch {
                    pdfWindow.document.write(`<div style="font-family: sans-serif; padding: 20px; color: red;">Failed to publish: ${escapeHtml(errMsg)}</div>`);
                }
            }
            showToast(errMsg, 'error');
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 pt-24 sm:pt-28">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left side: Queue */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow border border-slate-200 p-6 flex flex-col h-auto lg:h-[calc(100vh-4rem)]">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <ShieldCheck className="text-action-blue" />
                        Admin Review Gate
                    </h2>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {initialLoading ? (
                            <p className="text-slate-500 text-sm">Loading queue...</p>
                        ) : leads.length === 0 ? (
                            <p className="text-slate-500 text-sm">No recent uploads pending review.</p>
                        ) : null}
                        {leads.map(lead => {
                            const submitDate = lead.created_at ? new Date(lead.created_at) : new Date();
                            const isOld = (new Date().getTime() - submitDate.getTime()) > (3 * 24 * 60 * 60 * 1000);
                            const isPending = (lead as unknown).audit_status === 'data_uploaded' || (lead as unknown).audit_status === 'data_received';
                            const isOverdue = isPending && isOld;

                            return (
                            <div
                                key={lead.id}
                                className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'border-action-blue bg-blue-50' : isOverdue ? 'border-red-400 bg-red-50 hover:bg-red-100' : 'border-slate-200 bg-white hover:border-slate-400'}`}
                                onClick={() => {
                                    if (selectedLead?.id !== lead.id) {
                                        setSelectedLead(lead);
                                    }
                                }}
                            >
                                <h3 className="font-bold text-slate-800">{(lead as unknown).organization_name || 'Unknown Org'}</h3>
                                <p className="text-xs text-slate-500 mb-1 truncate">{lead.email}</p>
                                <p className={`text-xs font-medium mb-3 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                    Submitted: {submitDate.toLocaleDateString()}
                                    {isOverdue && ' (Overdue)'}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${(lead as unknown).audit_status === 'data_uploaded' || (lead as unknown).audit_status === 'data_received' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                        {(lead as unknown).audit_status === 'data_uploaded' || (lead as unknown).audit_status === 'data_received' ? 'Needs Review' : 'Published'}
                                    </span>
                                    {(lead as unknown).file_url && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const csvWindow = window.open('', '_blank');
                                                if (csvWindow) csvWindow.document.write('Loading CSV...');
                                                const { data, error } = await supabase.storage.from('audit_uploads').createSignedUrl((lead as unknown).file_url!, 3600);
                                                if (error) {
                                                    console.error("[CSV_DOWNLOAD] Signed URL error:", error);
                                                    if (csvWindow) csvWindow.close();
                                                    return;
                                                }
                                                if (data) {
                                                    let finalUrl = data.signedUrl;
                                                    if (!finalUrl.startsWith('http')) {
                                                        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                                                        const storagePath = finalUrl.startsWith('/storage/v1') ? '' : '/storage/v1';
                                                        finalUrl = `${baseUrl}${storagePath}${finalUrl}`;
                                                    }
                                                    if (csvWindow) {
                                                        csvWindow.location.href = finalUrl;
                                                    } else {
                                                        window.open(finalUrl, '_blank');
                                                    }
                                                }
                                            }}
                                            className="text-xs px-2 py-1 rounded font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center gap-1"
                                            title="Download the client's uploaded CSV file"
                                        >
                                            <Download size={12} /> View Input CSV
                                        </button>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right side: Editor */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow border border-slate-200 flex flex-col h-auto min-h-[500px] lg:h-[calc(100vh-4rem)]">
                    {!selectedLead ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <FileText size={48} className="mb-4 text-slate-300" />
                            <p className="text-lg font-medium">Select a submission from the queue to review and publish the report.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-y-auto">
                            {/* Calibration Section */}
                            <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                                <div className="flex items-baseline gap-3 mb-1">
                                    <h2 className="text-lg font-bold text-slate-800">{(selectedLead as unknown).organization_name || 'Unknown Org'}</h2>
                                    <p className="text-xs text-slate-500 truncate">{selectedLead.email}{(selectedLead as unknown).portfolio_context_count ? ` · ~${(selectedLead as unknown).portfolio_context_count} initiatives` : ''}</p>
                                </div>
                                {(selectedLead as unknown).primary_pain_point && (
                                    <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Primary Governance Pain Point</p>
                                        <p className="text-xs text-amber-900 leading-snug">{(selectedLead as unknown).primary_pain_point}</p>
                                    </div>
                                )}

                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Calculator size={14} className="text-action-blue" />
                                        Capacity Calibration - Slot-Sync Session
                                        {calibrationSaving && <Loader2 size={13} className="ml-auto animate-spin text-slate-400" />}
                                        {!calibrationSaving && isCalibrationValid && (selectedLead as unknown).calibration_large_steerable && <CheckCircle2 size={13} className="ml-auto text-green-500" />}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 mb-1">Large/Steerable</label>
                                              <input
                                                  type="number"
                                                  min="1"
                                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-action-blue focus:border-action-blue outline-none"
                                                  placeholder="e.g. 3"
                                                  value={calibrationLargeSteerable}
                                                  onChange={e => setCalibrationLargeSteerable(e.target.value)}
                                                  onBlur={handleSaveCalibration}
                                              />
                                              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Tier 1 limit</p>
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 mb-1">Historical Avg</label>
                                              <input
                                                  type="number"
                                                  min="1"
                                                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-action-blue focus:border-action-blue outline-none"
                                                  placeholder="e.g. 12"
                                                  value={calibrationHistoricalAvg}
                                                  onChange={e => setCalibrationHistoricalAvg(e.target.value)}
                                                  onBlur={handleSaveCalibration}
                                              />
                                              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Best year</p>
                                          </div>
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 mb-1">Friction (Fm) <span className="font-normal text-slate-400">(1.0–2.5)</span></label>
                                              <input
                                                  type="number"
                                                  step="0.05"
                                                  min="1.0"
                                                  max="2.5"
                                                  className={`w-full px-3 py-1.5 border rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-action-blue focus:border-action-blue outline-none ${
                                                      !isNaN(frictionVal) && (frictionVal < 1.0 || frictionVal > 2.5)
                                                          ? 'border-red-400 bg-red-50'
                                                          : 'border-slate-300'
                                                  }`}
                                                  placeholder="e.g. 1.00"
                                                  value={frictionCoefficient}
                                                  onChange={e => setFrictionCoefficient(e.target.value)}
                                                  onBlur={handleSaveCalibration}
                                              />
                                              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">Admin. drag · 1.0 = none, 2.5 = max</p>
                                          </div>
                                      </div>

                                    {isCalibrationValid && (
                                        <div className="flex items-center gap-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                                            <div>
                                                <div className="text-[11px] text-slate-500 font-medium">Calculated Capacity Baseline</div>
                                                <div className="text-xl font-mono font-bold text-slate-800">{calculatedBaseline} <span className="text-xs text-slate-500 font-sans">Focus Slots</span></div>
                                            </div>
                                            <div className="text-[11px] text-slate-400 ml-auto font-mono hidden sm:block">
                                                ({largeSteerable} × 5) + (max(0, {historicalAvg} − {largeSteerable}) × 3)
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Loading state */}
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                                    <Loader2 className="animate-spin mb-4" size={48} />
                                    <p className="font-bold text-lg mb-2">Running AI Analysis Pipeline...</p>
                                    <p className="text-sm">Agent 1 (AI Context Engine) is building the structured analytical brief. Agent 2 (AI Editorial) will rewrite it into executive prose.</p>
                                </div>
                            ) : draftData && draftAnalysis ? (
                                /* Draft review editor */
                                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
                                    <div className="flex gap-6 text-sm mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-500 font-medium">Capacity Baseline</span>
                                            <span className="font-bold text-slate-800 text-lg">{draftData.calculated_capacity_baseline} Slots</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-slate-500 font-medium">Total Load</span>
                                            <span className="font-bold text-slate-800 text-lg">{draftData.total_current_load} Slots</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-slate-500 font-medium">Utilization</span>
                                            <span className={`font-bold text-lg ${draftData.total_current_load > draftData.calculated_capacity_baseline ? 'text-red-600' : 'text-green-600'}`}>
                                                {Math.round((draftData.total_current_load / draftData.calculated_capacity_baseline) * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pb-6 border-b border-slate-200">
                                        <div className="space-y-2">
                                            <label className="font-bold text-slate-700 block text-lg">Executive Summary {'&'} Structural Diagnosis</label>
                                            <div className="w-full p-4 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-500 font-sans cursor-not-allowed">
                                                [Locked - Dynamic Render] Generated mathematically via baseline and fiscal drag variables.
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-bold text-slate-700 block text-lg">Section 1 & 2: Load Visualisation</label>
                                            <div className="w-full p-4 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-500 font-sans cursor-not-allowed">
                                                [Locked - Dynamic Render] Generated mathematically.
                                            </div>
                                        </div>
                                    </div>

                                    {draftAnalysis.internal_critique && (
                                        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 text-sm">
                                            <p className="font-bold flex items-center gap-2 mb-1">
                                                <ShieldCheck size={16} /> Lead Editor Critique (Claude 4.6)
                                            </p>
                                            <p>{draftAnalysis.internal_critique}</p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="font-bold text-slate-700 block text-lg">Section 3: Where Ambition Exceeds Capacity</label>
                                        <textarea
                                            className="w-full h-64 p-4 border border-slate-300 rounded-lg text-slate-800 font-sans focus:ring-2 focus:ring-action-blue outline-none"
                                            value={draftAnalysis.section3}
                                            onChange={e => {
                                                const updated = { ...draftAnalysis, section3: e.target.value };
                                                setDraftAnalysis(updated);
                                                localStorage.setItem(`draftAnalysis_${selectedLead.id}`, JSON.stringify(updated));
                                            }}
                                        />
                                        <p className="text-xs text-slate-500">Edit LLM draft to ensure accuracy. Markdown supported.</p>
                                    </div>

                                    <div className="space-y-4 border-t border-slate-200 pt-6 mt-6">
                                        <label className="font-bold text-slate-700 block text-lg">Section 4: Courses of Action</label>
                                        <textarea
                                            className="w-full h-80 p-4 border border-slate-300 rounded-lg text-slate-800 font-sans focus:ring-2 focus:ring-action-blue outline-none"
                                            value={draftAnalysis.section4}
                                            onChange={e => {
                                                const updated = { ...draftAnalysis, section4: e.target.value };
                                                setDraftAnalysis(updated);
                                                localStorage.setItem(`draftAnalysis_${selectedLead.id}`, JSON.stringify(updated));
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-2 pt-6 border-t border-slate-200">
                                        <label className="font-bold text-slate-700 block text-lg">Section 5: Recommended Next Steps</label>
                                        <div className="w-full p-4 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-500 font-sans cursor-not-allowed">
                                            [Locked - Dynamic Render] Generated systematically to embed governance workflows.
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Prompt to generate or calibration gate */
                                <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                    {!isCalibrationValid ? (
                                        <>
                                            <AlertTriangle size={48} className="mb-4 text-amber-400" />
                                            <p className="text-lg font-medium text-slate-600 mb-2">Calibration Required</p>
                                            <p className="text-sm text-slate-500 max-w-md">Capacity calibration inputs are required before report generation. Record the values from the Slot-Sync Session in the fields above.</p>
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={48} className={`mb-4 ${(selectedLead as unknown).report_url ? "text-green-500" : "text-slate-300"}`} />
                                            <p className="text-lg font-medium text-slate-600 mb-4">
                                                {(selectedLead as unknown).report_url 
                                                    ? "This report has already been published." 
                                                    : "Calibration complete. Ready to generate."}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                {(selectedLead as unknown).report_url && (
                                                    <button
                                                        onClick={async () => {
                                                            const pdfWindow = window.open('', '_blank');
                                                            if (pdfWindow) pdfWindow.document.write('Loading PDF...');
                                                            const { data } = await supabase.storage.from('audit_reports').createSignedUrl((selectedLead as unknown).report_url, 3600);
                                                            if (data) {
                                                                let finalUrl = data.signedUrl;
                                                                if (!finalUrl.startsWith('http')) {
                                                                    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                                                                    const storagePath = finalUrl.startsWith('/storage/v1') ? '' : '/storage/v1';
                                                                    finalUrl = `${baseUrl}${storagePath}${finalUrl}`;
                                                                }
                                                                if (pdfWindow) {
                                                                    pdfWindow.location.href = finalUrl;
                                                                } else {
                                                                    window.open(finalUrl, '_blank');
                                                                }
                                                            } else if (pdfWindow) {
                                                                pdfWindow.close();
                                                            }
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2"
                                                    >
                                                        <FileText size={18} /> View Published PDF
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleGenerateDraft}
                                                    className="bg-action-blue text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                                >
                                                    {(selectedLead as unknown).report_url ? "Re-generate AI Draft" : "Generate AI Draft"} <Send size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Footer actions */}
                            {draftData && draftAnalysis && (
                                <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex flex-col gap-4">
                                    {successMsg && (
                                        <div className="w-full mb-2 flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-xl space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                            <div className="text-green-800 font-bold text-center text-lg flex items-center gap-2"><ShieldCheck className="text-green-600" /> {successMsg}</div>
                                            {(selectedLead as unknown).report_url && (
                                                <button
                                                    onClick={async () => {
                                                        const { data } = await supabase.storage.from('audit_reports').createSignedUrl((selectedLead as unknown).report_url!, 3600);
                                                        if (data) {
                                                            let finalUrl = data.signedUrl;
                                                            if (!finalUrl.startsWith('http')) {
                                                                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                                                                const storagePath = finalUrl.startsWith('/storage/v1') ? '' : '/storage/v1';
                                                                finalUrl = `${baseUrl}${storagePath}${finalUrl}`;
                                                            }
                                                            window.open(finalUrl, '_blank');
                                                        }
                                                    }}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5"
                                                >
                                                    <FileText size={18} /> View Generated PDF Report
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handlePublish}
                                            disabled={publishing}
                                            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 inline-flex"
                                        >
                                            {publishing ? 'Publishing Context...' : (
                                                <>Publish to PDF <Send size={18} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
