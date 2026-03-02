import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './Button';

interface CommitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCommit: (rationale: string) => void;
    saving: boolean;
}

export const CommitModal: React.FC<CommitModalProps> = ({ isOpen, onClose, onCommit, saving }) => {
    const [rationale, setRationale] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRationale('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                    <h3 className="text-lg font-bold text-white">Commit Strategic Changes</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-400 mb-4">
                        Please provide a rationale for your changes. This will be recorded in the Strategic Ledger for audit purposes.
                    </p>

                    <textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="e.g., Prioritizing AI initiatives due to new market data..."
                        className="w-full h-32 px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                        className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
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
