
import React from 'react';
import { useStrategicLedger } from '../hooks/useStrategicLedger';
import { CheckCircle2, PauseCircle, RefreshCcw, ScrollText, Printer } from 'lucide-react';
import { Button } from './Button';

const ActionIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'approve': return <CheckCircle2 className="text-green-500" size={20} />;
        case 'pause': return <PauseCircle className="text-yellow-500" size={20} />;
        case 'resume': return <RefreshCcw className="text-blue-500" size={20} />;
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

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Audit Trail...</div>;
    if (error) return <div className="p-8 text-center text-red-400">Error loading ledger: {error}</div>;

    const handlePrint = () => {
        window.print();
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
                <Button onClick={handlePrint} variant="secondary" className="print:hidden">
                    <Printer size={16} className="mr-2" />
                    Export PDF
                </Button>
            </div>

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
                                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full cursor-default
                                    ${entry.action_type === 'approve' ? 'bg-green-500/20 text-green-400' :
                                        entry.action_type === 'pause' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-blue-500/20 text-blue-400'} print:border print:border-black print:text-black print:bg-white`}>
                                    {entry.action_type}
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
