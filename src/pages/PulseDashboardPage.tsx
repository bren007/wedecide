import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Activity, AlertTriangle, ArrowRight, CheckCircle, Database, ShieldCheck, DollarSign } from 'lucide-react';

type Lead = any; // simplified for dashboard

export const PulseDashboardPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTelemtry();
    }, []);

    const fetchTelemtry = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setLeads(data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center ">
                <p className="text-slate-500 flex items-center gap-2"><Activity className="animate-pulse" /> Loading Telemetry...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center  text-red-500 font-bold">
                Access Denied: Admin Only Route
            </div>
        );
    }

    // Total Checkouts -> total entries that reached at least 'checkout_started' 
    // Usually every lead is at least a checkout_started if they hit the stripe page, we can approximate by Leads that exist
    const totalCheckouts = leads.length; // everything in leads table is a checkout started at least 

    // Payment Secured -> any status that is 'payment_secured' or beyond
    const paymentsSecured = leads.filter(l =>
        l.audit_status === 'payment_secured' ||
        l.audit_status === 'data_uploaded' ||
        l.audit_status === 'data_received' || // legacy status fallback
        l.audit_status === 'report_generated' || // legacy status fallback
        l.audit_status === 'draft_generated' ||
        l.audit_status === 'report_delivered' ||
        l.audit_status === 'license_won' ||
        l.audit_status === 'license_lost'
    ).length;

    const dataUploaded = leads.filter(l =>
        l.audit_status === 'data_uploaded' ||
        l.audit_status === 'data_received' ||
        l.audit_status === 'report_generated' ||
        l.audit_status === 'draft_generated' ||
        l.audit_status === 'report_delivered' ||
        l.audit_status === 'license_won' ||
        l.audit_status === 'license_lost'
    ).length;

    const reportsDelivered = leads.filter(l =>
        l.audit_status === 'report_delivered' ||
        l.audit_status === 'license_won' ||
        l.audit_status === 'license_lost' ||
        l.audit_status === 'report_generated' // legacy fallback
    ).length;

    const licensesWon = leads.filter(l => l.audit_status === 'license_won').length;

    // Price Shock Drop-out
    const priceShockRate = totalCheckouts > 0 ? ((totalCheckouts - paymentsSecured) / totalCheckouts * 100).toFixed(1) : '0.0';

    // Template Friction Drop-out
    const templateFrictionRate = paymentsSecured > 0 ? ((paymentsSecured - dataUploaded) / paymentsSecured * 100).toFixed(1) : '0.0';

    // Golden Ratio
    const goldenRatioRate = reportsDelivered > 0 ? (licensesWon / reportsDelivered * 100).toFixed(1) : '0.0';


    // Stalled Audits (payment_secured is true, but data_uploaded is false for > 48 hours)
    const now = new Date();
    const stalledAudits = leads.filter(l => {
        const isPaidButNotUploaded = l.audit_status === 'payment_secured';
        if (!isPaidButNotUploaded) return false;

        let paymentDateStr = l.payment_at || l.created_at; // Fallback to created_at if payment_at not set yet
        const paymentDate = new Date(paymentDateStr);
        const diffHours = (now.getTime() - paymentDate.getTime()) / (1000 * 3600);
        return diffHours > 48;
    });

    return (
        <div className="min-h-screen bg-slate-900 p-8  text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">

                <header className="flex justify-between items-end border-b border-slate-700 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Activity className="text-blue-500" />
                            Pulse Telemetry
                        </h1>
                        <p className="text-slate-400 mt-2">Executive Funnel Diagnostics & Action Queue</p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                            Admin Only
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Funnel Widget 1 */}
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex flex-col items-center text-center">
                        <DollarSign size={32} className="text-amber-500 mb-4" />
                        <h3 className="text-lg font-bold text-slate-100 mb-1">Price Shock Drop-out</h3>
                        <p className="text-slate-400 text-sm mb-6">Checkouts Started vs Payments Secured</p>

                        <div className="text-4xl font-extrabold text-amber-500 mb-2">{priceShockRate}%</div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <span className="text-slate-300">{totalCheckouts} Started</span>
                            <ArrowRight size={14} className="text-slate-500" />
                            <span className="text-amber-400">{paymentsSecured} Secured</span>
                        </div>
                    </div>

                    {/* Funnel Widget 2 */}
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex flex-col items-center text-center">
                        <Database size={32} className="text-blue-500 mb-4" />
                        <h3 className="text-lg font-bold text-slate-100 mb-1">Template Friction</h3>
                        <p className="text-slate-400 text-sm mb-6">Payments Secured vs Data Uploaded</p>

                        <div className="text-4xl font-extrabold text-blue-500 mb-2">{templateFrictionRate}%</div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <span className="text-slate-300">{paymentsSecured} Secured</span>
                            <ArrowRight size={14} className="text-slate-500" />
                            <span className="text-blue-400">{dataUploaded} Uploaded</span>
                        </div>
                    </div>

                    {/* Funnel Widget 3 */}
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl flex flex-col items-center text-center">
                        <ShieldCheck size={32} className="text-emerald-500 mb-4" />
                        <h3 className="text-lg font-bold text-slate-100 mb-1">The Golden Ratio</h3>
                        <p className="text-slate-400 text-sm mb-6">Reports Delivered vs Licenses Won</p>

                        <div className="text-4xl font-extrabold text-emerald-500 mb-2">{goldenRatioRate}%</div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <span className="text-slate-300">{reportsDelivered} Delivered</span>
                            <ArrowRight size={14} className="text-slate-500" />
                            <span className="text-emerald-400">{licensesWon} Won</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mt-8">
                    <div className="bg-slate-800/50 border-b border-slate-700 p-4 px-6 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <AlertTriangle className="text-rose-500" size={20} />
                            Action Queue: Stalled Audits
                        </h3>
                        <span className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded text-sm font-bold border border-rose-500/20">
                            &gt; 48h Delay
                        </span>
                    </div>

                    <div className="p-0">
                        {stalledAudits.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                <CheckCircle size={48} className="text-slate-600 mb-4" />
                                <p className="font-medium text-lg">No stalled audits.</p>
                                <p className="text-sm">All paid accounts have uploaded their datasets recently.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-slate-700">
                                {stalledAudits.map(lead => (
                                    <li key={lead.id} className="p-6 flex flex-col lg:flex-row justify-between lg:items-center hover:bg-slate-700/30 transition-colors gap-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">{lead.organization_name || 'Unknown Organization'}</h4>
                                            <p className="text-slate-400 text-sm mb-2">{lead.email}</p>
                                            <p className="text-xs font-mono text-slate-500">ID: {lead.id}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider font-bold">Time since payment</p>
                                                <p className="text-rose-400 font-bold text-lg">
                                                    {Math.floor((now.getTime() - new Date(lead.payment_at || lead.created_at).getTime()) / (1000 * 3600))} hrs
                                                </p>
                                            </div>
                                            <button className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-4 py-2 text-sm font-bold text-slate-200 transition-colors">
                                                Email Nudge
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
