import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, ArrowRight, RotateCcw, AlertTriangle, CheckCircle, Loader2, Gauge } from 'lucide-react';
import { Button } from './Button';

interface AuditImportPromptProps {
    onImportComplete: () => void;
    onSkip: () => void;
}

const normalizeToken = (input: string) => {
    const cleaned = input.replace(/\s+/g, '').toUpperCase();
    const prefixMatch = cleaned.match(/^ALTA-?(.*)$/);
    if (prefixMatch && prefixMatch[1]) {
        return `ALTA-${prefixMatch[1].replace(/-/g, '')}`;
    }
    return cleaned;
};

interface CalibrationData {
    large_steerable: number | null;
    historical_avg: number | null;
    capacity_baseline: number | null;
}

export const AuditImportPrompt: React.FC<AuditImportPromptProps> = ({ onImportComplete, onSkip }) => {
    const [step, setStep] = useState<'input' | 'confirm' | 'importing' | 'imported' | 'error'>('input');
    const [token, setToken] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [initiativeCount, setInitiativeCount] = useState(0);
    const [validating, setValidating] = useState(false);
    const [calibration, setCalibration] = useState<CalibrationData | null>(null);

    const handleValidateToken = async () => {
        if (!token.trim()) return;
        setValidating(true);
        setErrorMessage('');

        const cleanedToken = normalizeToken(token);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Call Edge Function to validate token (uses service role)
            const { data, error } = await supabase.functions.invoke('import-audit-portfolio', {
                body: { action: 'validate', audit_token: cleanedToken }
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
        } catch (err) {
            const error = err as Error;
            setErrorMessage(error.message || 'Validation failed. Please try again.');
            setStep('error');
        } finally {
            setValidating(false);
        }
    };

    const handleImport = async () => {
        setStep('importing');
        const cleanedToken = normalizeToken(token);
        try {
            const { data, error } = await supabase.functions.invoke('import-audit-portfolio', {
                body: { action: 'import', audit_token: cleanedToken }
            });

            if (error) {
                let errBody = "";
                if (error.context && typeof error.context.text === 'function') {
                    try {
                        const clone = error.context.clone();
                        errBody = await clone.text();
                    } catch (e) {
                        console.error("Could not parse error context:", e);
                    }
                }
                console.error("Invoke error:", error, "Body:", errBody);
                throw new Error(`Import failed: ${errBody || error.message}`);
            }
            if (data.status !== 'success') throw new Error(data.message || 'Import failed');

            // Store calibration data for confirmation screen
            if (data.calibration) {
                setCalibration(data.calibration);
            }

            setStep('imported');
        } catch (err) {
            console.error("Import catch error:", err);
            const error = err as Error;
            setErrorMessage(error.message || 'Import failed. Please try again.');
            setStep('error');
        }
    };

    const handleStartFresh = async () => {
        // Mark token as declined (but not consumed — client can return later)
        const cleanedToken = normalizeToken(token);
        try {
            await supabase.functions.invoke('import-audit-portfolio', {
                body: { action: 'decline', audit_token: cleanedToken }
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

                {/* Step: Import Complete — Capacity Baseline Confirmation */}
                {step === 'imported' && (
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8 backdrop-blur-sm">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                                <Gauge size={32} className="text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Your Capacity Baseline Has Been Set</h3>
                            <p className="text-sm text-slate-400">
                                Based on your Strategic Capacity Audit, your organisation's governance physics have been configured.
                            </p>
                        </div>

                        {calibration && calibration.large_steerable && calibration.historical_avg && (
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg">
                                    <span className="text-sm text-slate-400">Executive Steering Capacity</span>
                                    <span className="text-white font-bold">{calibration.large_steerable} large initiatives</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg">
                                    <span className="text-sm text-slate-400">Historical Throughput Reference</span>
                                    <span className="text-white font-bold">{calibration.historical_avg} active projects</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                                    <span className="text-sm text-green-300 font-medium">Maximum Capacity Baseline</span>
                                    <span className="text-green-400 font-bold text-lg">
                                        {calibration.capacity_baseline ||
                                            ((calibration.large_steerable * 5) + Math.max(0, calibration.historical_avg - calibration.large_steerable) * 3)
                                        } Focus Slots
                                    </span>
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-slate-500 text-center mb-6">
                            Your portfolio has been imported. Your Command Centre is ready.
                        </p>

                        <Button
                            variant="primary"
                            onClick={onImportComplete}
                            className="w-full justify-center bg-green-600 hover:bg-green-500"
                        >
                            Open Command Centre <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
