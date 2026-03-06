import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, ArrowRight, RotateCcw, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface AuditImportPromptProps {
    onImportComplete: () => void;
    onSkip: () => void;
}

export const AuditImportPrompt: React.FC<AuditImportPromptProps> = ({ onImportComplete, onSkip }) => {
    const [step, setStep] = useState<'input' | 'confirm' | 'importing' | 'error'>('input');
    const [token, setToken] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [initiativeCount, setInitiativeCount] = useState(0);
    const [validating, setValidating] = useState(false);

    const handleValidateToken = async () => {
        if (!token.trim()) return;
        setValidating(true);
        setErrorMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Call Edge Function to validate token (uses service role)
            const { data, error } = await supabase.functions.invoke('import-audit-portfolio', {
                body: { action: 'validate', audit_token: token.trim() }
            });

            if (error) throw error;

            if (data.status === 'valid') {
                setInitiativeCount(data.initiative_count);
                setStep('confirm');
            } else if (data.status === 'already_consumed') {
                setErrorMessage('This Audit Reference has already been used. Contact AlturaGov if you believe this is an error.');
                setStep('error');
            } else if (data.status === 'not_found') {
                setErrorMessage('Audit Reference not recognised. Please check your Strategic Capacity Assessment PDF or contact AlturaGov.');
                setStep('error');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Validation failed. Please try again.');
            setStep('error');
        } finally {
            setValidating(false);
        }
    };

    const handleImport = async () => {
        setStep('importing');
        try {
            const { data, error } = await supabase.functions.invoke('import-audit-portfolio', {
                body: { action: 'import', audit_token: token.trim() }
            });

            if (error) throw error;
            if (data.status !== 'success') throw new Error(data.message || 'Import failed');

            onImportComplete();
        } catch (err: any) {
            setErrorMessage(err.message || 'Import failed. Please try again.');
            setStep('error');
        }
    };

    const handleStartFresh = async () => {
        // Mark token as declined (but not consumed — client can return later)
        try {
            await supabase.functions.invoke('import-audit-portfolio', {
                body: { action: 'decline', audit_token: token.trim() }
            });
        } catch { /* non-critical */ }
        onSkip();
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                        <FileText size={32} className="text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome to Your Command Centre</h2>
                    <p className="text-slate-400 text-sm">Have you completed a Strategic Capacity Audit? Enter your Audit Reference to import your portfolio.</p>
                </div>

                {/* Step: Token Input */}
                {(step === 'input' || step === 'error') && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Audit Reference</label>
                        <input
                            type="text"
                            value={token}
                            onChange={e => setToken(e.target.value.toUpperCase())}
                            placeholder="ALTA-XXXX-XXXX"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-lg tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder:text-slate-600"
                            onKeyDown={e => e.key === 'Enter' && handleValidateToken()}
                        />

                        {step === 'error' && (
                            <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-start gap-2">
                                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-300">{errorMessage}</p>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={onSkip}
                                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                Start Fresh →
                            </button>
                            <Button
                                variant="primary"
                                onClick={handleValidateToken}
                                disabled={!token.trim() || validating}
                                isLoading={validating}
                            >
                                Validate Reference
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Import Confirmation */}
                {step === 'confirm' && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-start gap-3 mb-6">
                            <CheckCircle size={24} className="text-green-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Portfolio Ready to Import</h3>
                                <p className="text-sm text-slate-400">
                                    Your Strategic Capacity Audit portfolio is ready to import. This will load <span className="text-white font-bold">{initiativeCount} initiatives</span> into your Command Centre with all classifications, priority tiers, approval mandates, and delivery quarters pre-populated.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-3">
                            <button
                                onClick={handleStartFresh}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors px-3 py-2 hover:bg-slate-700/50 rounded-lg"
                            >
                                <RotateCcw size={14} />
                                Start Fresh
                            </button>
                            <Button variant="primary" onClick={handleImport} className="bg-green-600 hover:bg-green-500">
                                <ArrowRight size={16} className="mr-2" />
                                Import Portfolio
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Importing */}
                {step === 'importing' && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 text-center backdrop-blur-sm">
                        <Loader2 size={32} className="text-blue-400 animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white mb-1">Importing Portfolio</h3>
                        <p className="text-sm text-slate-400">Loading {initiativeCount} initiatives into your Command Centre...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
