import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './Button';

interface CommitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCommit: (rationale: string) => void;
    saving: boolean;
    isSevere?: boolean;
    initialRationale?: string;
}

const CommitModalInner: React.FC<CommitModalProps> = ({ onClose, onCommit, saving, isSevere = false, initialRationale = '' }) => {
    const [rationale, setRationale] = useState(initialRationale);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className={`w-full max-w-lg bg-slate-900 border ${isSevere ? 'border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.15)]' : 'border-slate-700 shadow-2xl'} rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                <div className={`flex justify-between items-center px-6 py-4 border-b ${isSevere ? 'border-red-900/50 bg-red-950/30' : 'border-slate-800 bg-slate-900/50'}`}>
                    <h3 className={`text-lg font-bold ${isSevere ? 'text-red-400' : 'text-white'}`}>
                        {isSevere ? 'Commit Outside Governance Session' : 'Commit Strategic Changes'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className={`text-sm mb-4 ${isSevere ? 'text-orange-200/80 font-medium' : 'text-slate-400'}`}>
                        {isSevere
                            ? "You are committing a structural portfolio change outside of a formal governance session. This decision will be recorded in the Strategic Ledger with a timestamp and your identity. You must provide a rationale."
                            : "Please provide a rationale for your changes. This will be recorded in the Strategic Ledger for audit purposes."
                        }
                    </p>

                    <textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="e.g., Prioritizing AI initiatives due to new market data..."
                        className={`w-full h-32 px-4 py-3 bg-slate-950 border ${isSevere ? 'border-red-900/50 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'} rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent resize-none`}
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onCommit(rationale)}
                        disabled={!rationale.trim() || saving}
                        className={`${isSevere ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'} text-white`}
                    >
                        {saving ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                Commit Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const CommitModal: React.FC<CommitModalProps> = (props) => {
    if (!props.isOpen) return null;
    return <CommitModalInner {...props} />;
};
