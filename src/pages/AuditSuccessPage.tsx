import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { InlineWidget, useCalendlyEventListener } from 'react-calendly';
import { supabase } from '../lib/supabase';
import { useToasts } from '../context/ToastContext';
import './AuditSuccessPage.css';

export const AuditSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToasts();
    const sessionId = searchParams.get('session_id');
    
    const [loading, setLoading] = useState(true);
    const [customerData, setCustomerData] = useState<{ customer_email: string, customer_name: string, calendly_url?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scheduled, setScheduled] = useState(false);

    const fetchSessionDetails = useCallback(async () => {
      console.log('🔍 Validating Stripe Session:', sessionId);
      try {
        console.log('Invoking get-session-details Edge Function...');
        const { data, error: invokeError } = await supabase.functions.invoke(`get-session-details?session_id=${sessionId}`, {
          method: 'GET'
        });
        if (invokeError) {
          console.error('❌ Supabase Invoke Error:', invokeError);
          throw invokeError;
        }
        console.log('Session Data Received:', data);
        setCustomerData(data);
      } catch (err: unknown) {
        console.error("🔥 Error fetching session details:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }, [sessionId]);

    useEffect(() => {
        if (sessionId) {
            fetchSessionDetails();
        } else {
            setError("Missing session_id");
            setLoading(false);
        }
    }, [sessionId, fetchSessionDetails]);

    useCalendlyEventListener({
        onEventScheduled: (e) => {
            console.log('Calendly Event Scheduled:', e);
            setScheduled(true);
            showToast('Slot-Sync session successfully scheduled!', 'success');
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="text-action-blue animate-spin mb-4" size={48} />
                <h2 className="text-2xl font-bold text-white">Validating Payment...</h2>
                <p className="text-slate-400 mt-2">Connecting to secure billing gateway...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white">Verification Pending</h2>
                <p className="text-slate-400 mt-2 max-w-md">
                    We couldn't verify your session automatically. If you've just completed payment, please wait a moment or check your email for confirmation.
                </p>
                <button 
                    onClick={() => navigate('/audit')}
                    className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors"
                >
                    Return to Audit
                </button>
            </div>
        );
    }

    const calendlyUrl = customerData?.calendly_url || "https://calendly.com/alturagov/executive-slot-sync";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pt-32 pb-16 font-sans">
            <div className="container max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* Left Column: Confirmation & Instructions */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest">
                            <CheckCircle size={14} /> Payment Confirmed
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                            Your Strategic Capacity Audit is <span className="text-action-blue">Now Active.</span>
                        </h1>
                        
                        <div className="space-y-6">
                            <div className="flex gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 font-bold text-blue-400">1</div>
                                <div>
                                    <h3 className="font-bold text-white mb-1 text-lg">Book your Executive Slot-Sync</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        Use the calendar widget to secure your 60-minute calibration session. This is the core engine alignment for your audit.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 font-bold text-slate-400">2</div>
                                <div>
                                    <h3 className="font-bold text-white mb-1 text-lg">Check your Inbox</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        An email has been sent to <strong className="text-slate-200">{customerData?.customer_email}</strong> with your data upload instructions and secure portal link.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <button 
                                onClick={() => navigate('/command-center')}
                                className="flex items-center gap-2 text-slate-400 font-bold hover:text-white transition-colors"
                            >
                                Dashboard Preview <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Calendly Embed or Confirmation */}
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <span>
                                🔒 Having trouble loading the calendar or using ad/tracker blockers?
                            </span>
                            <a 
                                href={calendlyUrl}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-action-blue hover:underline font-bold shrink-0 flex items-center gap-1"
                            >
                                Open Scheduler in New Tab <ArrowRight size={12} />
                            </a>
                        </div>

                        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-right-8 duration-700 delay-200 min-h-[700px] border border-slate-800">
                            {scheduled ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center h-[700px] bg-slate-900/60 border border-slate-800 rounded-3xl animate-in zoom-in duration-500">
                                    <CheckCircle size={64} className="text-green-500 mb-6" />
                                    <h2 className="text-3xl font-bold text-white mb-4">Slot-Sync Scheduled!</h2>
                                    <p className="text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
                                        Your calibration session is locked in. We have sent a confirmation email with calendar details to <strong className="text-slate-200">{customerData?.customer_email}</strong>.
                                    </p>
                                    <button
                                        onClick={() => navigate('/command-center')}
                                        className="px-6 py-3 bg-action-blue hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        Go to Command Center
                                    </button>
                                </div>
                            ) : (
                                <InlineWidget 
                                    url={calendlyUrl}
                                    styles={{ height: '700px' }}
                                    pageSettings={{
                                        backgroundColor: '0a0f1c',
                                        hideEventTypeDetails: false,
                                        hideLandingPageDetails: false,
                                        primaryColor: '3b82f6',
                                        textColor: 'ffffff'
                                    }}
                                    prefill={{
                                        email: customerData?.customer_email,
                                        name: customerData?.customer_name,
                                        customAnswers: {
                                            a1: sessionId || undefined,
                                            a2: sessionId || undefined
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

