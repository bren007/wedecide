
import React, { useState } from 'react';
import { useStrategicLedger } from '../hooks/useStrategicLedger';
import { CheckCircle2, PauseCircle, RefreshCcw, ScrollText, Printer, Edit3, X, Calendar as CalendarIcon, ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { exportStrategicLedgerToPDF } from '../utils/pdfGenerator';

const ActionIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'approve': return <CheckCircle2 className="text-green-500" size={20} />;
        case 'pause': return <PauseCircle className="text-yellow-500" size={20} />;
        case 'resume': return <RefreshCcw className="text-blue-500" size={20} />;
        case 'update': return <Edit3 className="text-purple-500" size={20} />;
        default: return <ScrollText className="text-slate-500" size={20} />;
    }
};

const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const StrategicLedger: React.FC = () => {
    const { entries, loading, error } = useStrategicLedger();
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Default end date to today
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState<string>('');
    const [classification, setClassification] = useState<string>('None');
    const [customClassification, setCustomClassification] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Audit Trail...</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error loading ledger: {error}</div>;

    const handleGeneratePDF = async () => {
        if (!startDate || !endDate) return;
        setIsExporting(true);
        try {
            const finalClassification = classification === 'Custom' ? customClassification : (classification === 'None' ? '' : classification);
            await exportStrategicLedgerToPDF(entries, startDate, endDate, finalClassification);
            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF. Check console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl print:shadow-none print:border-none print:bg-white print:text-black">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-950 border-b border-slate-800 print:bg-white print:border-b-2 print:border-black">
                <div className="flex items-center gap-3">
                    <ScrollText className="text-purple-400 print:text-black" />
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 print:text-black">Strategic Decision Ledger</h2>
                        <p className="text-xs text-slate-500 font-mono print:hidden">Immutable Audit Trail • {entries.length} Records</p>
                    </div>
                </div>
                <Button onClick={() => setIsExportModalOpen(true)} variant="secondary" className="print:hidden">
                    <Printer size={16} className="mr-2" />
                    Export PDF
                </Button>
            </div>

            {/* Export Modal */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:hidden">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Printer size={18} className="text-indigo-400" />
                                Export Record of Decision
                            </h3>
                            <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">Reporting Period</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg">
                                            <CalendarIcon size={16} className="text-slate-500 shrink-0" />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-transparent text-slate-200 text-sm focus:outline-none w-full"
                                                required
                                            />
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 pl-1">Start Date</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg">
                                            <CalendarIcon size={16} className="text-slate-500 shrink-0" />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-transparent text-slate-200 text-sm focus:outline-none w-full"
                                                required
                                            />
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1 pl-1">End Date</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                                    <ShieldAlert size={14} className="text-amber-500" />
                                    Document Classification
                                </label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    value={classification}
                                    onChange={(e) => setClassification(e.target.value)}
                                >
                                    <option value="None">None (Unclassified)</option>
                                    <option value="FOR OFFICIAL USE ONLY">For Official Use Only</option>
                                    <option value="SENSITIVE">Sensitive</option>
                                    <option value="IN CONFIDENCE">In Confidence</option>
                                    <option value="Custom">Custom marking...</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    Markings are rendered on the document header and footers. The software does not enforce access constraints based on this choice.
                                </p>

                                {classification === 'Custom' && (
                                    <input
                                        type="text"
                                        placeholder="Enter custom marking (max 40 chars)"
                                        maxLength={40}
                                        value={customClassification}
                                        onChange={(e) => setCustomClassification(e.target.value)}
                                        className="w-full mt-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                            <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleGeneratePDF}
                                disabled={!startDate || !endDate || (classification === 'Custom' && !customClassification.trim()) || isExporting}
                            >
                                {isExporting ? 'Generating PDF...' : 'Generate PDF Export'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="p-6 space-y-8 print:space-y-4">
                {entries.length === 0 && (
                    <div className="text-center py-12 text-slate-500 italic">
                        No strategic decisions recorded yet.
                    </div>
                )}

                {entries.map((entry, index) => (
                    <div key={entry.id} className="relative pl-8 group print:pl-0">
                        {/* Vertical Line */}
                        {index !== entries.length - 1 && (
                            <div className="absolute left-2.5 top-8 bottom-[-32px] w-px bg-slate-800 group-hover:bg-slate-700 transition-colors print:hidden"></div>
                        )}

                        {/* Icon Node */}
                        <div className="absolute left-0 top-1 p-1 bg-slate-900 border border-slate-800 rounded-full shadow-sm group-hover:border-slate-600 transition-colors print:hidden">
                            <ActionIcon type={entry.action_type} />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-2">
                            {/* Meta Header */}
                            <div className="flex justify-between items-baseline print:border-b print:border-gray-200 print:pb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-200 text-sm print:text-black">
                                        {formatDate(entry.created_at)}
                                    </span>
                                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 print:border-gray-300 print:bg-white print:text-gray-600">
                                        by {entry.users?.email?.split('@')[0] || 'Unknown'}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md cursor-default border
                                    ${entry.action_type === 'approve' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                        entry.action_type === 'pause' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                            entry.action_type === 'resume' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                entry.action_type === 'update' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    'bg-slate-800 text-slate-400 border-slate-700'} print:border print:border-black print:text-black print:bg-white`}>
                                    {entry.action_type === 'approve' ? 'Approved' :
                                        entry.action_type === 'pause' ? 'Parked' :
                                            entry.action_type === 'resume' ? 'Resumed' :
                                                entry.action_type === 'update' ? 'Details Updated' :
                                                    entry.action_type}
                                </span>
                            </div>

                            {/* Main Statement */}
                            <div className="text-base text-slate-300 font-medium leading-relaxed print:text-black">
                                Affected Initiative: <strong className="text-white print:text-black">{entry.initiatives?.title || 'Unknown Initiative'}</strong>
                            </div>

                            {/* Rationale Quote */}
                            {entry.rationale && (
                                <div className="mt-1 pl-4 border-l-2 border-slate-700 italic text-slate-400 text-sm py-1 bg-slate-800/30 rounded-r-lg print:border-l-4 print:border-gray-400 print:text-gray-700 print:bg-gray-50">
                                    "{entry.rationale}"
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
