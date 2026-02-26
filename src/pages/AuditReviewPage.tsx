import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { ShieldCheck, FileText, Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToasts } from '../context/ToastContext';

type Lead = Database['public']['Tables']['leads']['Row'];

export const AuditReviewPage: React.FC = () => {
    useAuth();
    const { showToast } = useToasts();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(false);
    const [draftData, setDraftData] = useState<any>(null);
    const [draftAnalysis, setDraftAnalysis] = useState<{ section3: string, scenarioA: string, scenarioB: string } | null>(null);
    const [publishing, setPublishing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .in('audit_status', ['data_received', 'report_generated'])
            .order('created_at', { ascending: false });

        if (!error) {
            setLeads(data || []);
        } else {
            console.error('Error fetching leads:', error);
        }
        setInitialLoading(false);
    };

    const handleGenerateDraft = async (lead: Lead) => {
        setSelectedLead(lead);
        setLoading(true);
        setDraftData(null);
        setDraftAnalysis(null);
        setSuccessMsg('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('http://localhost:3001/api/generate-draft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ email: lead.email })
            });

            const json = await res.json();
            if (!json.success) {
                throw new Error(json.error || 'Failed to generate draft.');
            }

            setDraftData(json.data);
            setDraftAnalysis(json.analysis);
        } catch (e: any) {
            console.error('Draft generation error:', e);
            showToast(e.message === 'Failed to fetch' ? 'Failed to connect to backend server. Make sure it is running on port 3001.' : e.message, 'error');
            setSelectedLead(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedLead || !draftData || !draftAnalysis) return;
        setPublishing(true);
        setSuccessMsg('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('http://localhost:3001/api/publish-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    email: selectedLead.email,
                    data: draftData,
                    analysis: draftAnalysis
                })
            });

            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Failed to publish.');

            setSuccessMsg('Report successfully published and linked to the lead profile.');
            fetchLeads(); // Refresh status list

            // Optionally update local list manually so the user sees it visually immediately
            setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, audit_status: 'report_generated', report_url: json.reportUrl } : l));
            setSelectedLead(prev => prev ? { ...prev, audit_status: 'report_generated', report_url: json.reportUrl } : null);
            showToast('Report generated successfully!', 'success');
        } catch (e: any) {
            console.error('Publish error:', e);
            showToast(e.message === 'Failed to fetch' ? 'Failed to connect to backend server. Make sure it is running on port 3001.' : e.message, 'error');
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-24">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left side: Queue */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow border border-slate-200 p-6 flex flex-col h-[calc(100vh-4rem)]">
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
                        {leads.map(lead => (
                            <div
                                key={lead.id}
                                className={`p-4 border rounded-xl cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'border-action-blue bg-blue-50' : 'border-slate-200 hover:border-slate-400'}`}
                                onClick={() => {
                                    if (selectedLead?.id !== lead.id) {
                                        setSelectedLead(null);
                                        setDraftData(null);
                                        setDraftAnalysis(null);
                                        handleGenerateDraft(lead);
                                    }
                                }}
                            >
                                <h3 className="font-bold text-slate-800">{lead.organization_name || 'Unknown Org'}</h3>
                                <p className="text-xs text-slate-500 mb-2 truncate">{lead.email}</p>
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${lead.audit_status === 'data_received' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                    {lead.audit_status === 'data_received' ? 'Needs Review' : 'Published'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side: Editor */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow border border-slate-200 flex flex-col h-[calc(100vh-4rem)]">
                    {!selectedLead ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <FileText size={48} className="mb-4 text-slate-300" />
                            <p className="text-lg font-medium">Select a submission from the queue to review and publish the report.</p>
                        </div>
                    ) : loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                            <Loader2 className="animate-spin mb-4" size={48} />
                            <p className="font-bold text-lg mb-2">Ingesting Database & Running LLM Inference...</p>
                            <p className="text-sm">Gemini 2.5 Pro is assessing the portfolio capacity constraint.</p>
                        </div>
                    ) : draftData && draftAnalysis ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 shrink-0">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">{draftData.organisation_name}</h2>
                                <div className="flex gap-6 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 font-medium">Capacity Baseline</span>
                                        <span className="font-bold text-slate-800 text-lg">{draftData.calculated_capacity_baseline} Slots</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 font-medium">Total Load</span>
                                        <span className="font-bold text-slate-800 text-lg">{draftData.total_current_load} Slots</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">

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

                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700 block">Section 3: Where Your Strategy is Exposed</label>
                                    <textarea
                                        className="w-full h-48 p-4 border border-slate-300 rounded-lg text-slate-800 font-sans focus:ring-2 focus:ring-action-blue outline-none"
                                        value={draftAnalysis.section3}
                                        onChange={e => setDraftAnalysis({ ...draftAnalysis, section3: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500">Edit LLM draft to ensure accuracy. Plain text rendering.</p>
                                </div>

                                <div className="space-y-4 border-t border-slate-200 pt-6 mt-6">
                                    <label className="font-bold text-slate-700 block text-lg">Section 4: Trade-Off Scenarios</label>

                                    <div className="space-y-2">
                                        <label className="font-bold text-slate-600 block text-sm">Scenario A (Status Quo)</label>
                                        <textarea
                                            className="w-full h-32 p-4 border border-slate-300 rounded-lg text-slate-800 font-sans focus:ring-2 focus:ring-action-blue outline-none"
                                            value={draftAnalysis.scenarioA}
                                            onChange={e => setDraftAnalysis({ ...draftAnalysis, scenarioA: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="font-bold text-slate-600 block text-sm">Scenario B ({draftData.total_current_load > draftData.calculated_capacity_baseline ? 'Rationalisation' : 'Acceleration'})</label>
                                        <textarea
                                            className="w-full h-40 p-4 border border-slate-300 rounded-lg text-slate-800 font-sans focus:ring-2 focus:ring-action-blue outline-none"
                                            value={draftAnalysis.scenarioB}
                                            onChange={e => setDraftAnalysis({ ...draftAnalysis, scenarioB: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-6 border-t border-slate-200">
                                    <label className="font-bold text-slate-700 block text-lg">Section 5: Recommended Next Steps</label>
                                    <div className="w-full p-4 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-500 font-sans cursor-not-allowed">
                                        [Locked - Dynamic Render] Generated systematically to embed governance workflows.
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 bg-white shrink-0 flex flex-col gap-4">
                                {successMsg && (
                                    <div className="w-full mb-2 flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-xl space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <div className="text-green-800 font-bold text-center text-lg flex items-center gap-2"><ShieldCheck className="text-green-600" /> {successMsg}</div>
                                        {selectedLead.report_url && (
                                            <button
                                                onClick={async () => {
                                                    const { data } = await supabase.storage.from('audit_reports').createSignedUrl(selectedLead.report_url!, 3600);
                                                    if (data) window.open(data.signedUrl, '_blank');
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
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
