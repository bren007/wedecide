import React, { useState } from 'react';
import { ArrowRight, Lock, CheckCircle, ShieldCheck, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STEPS = ['Scoping', 'Security_Trust', 'What_Youre_Commissioning', 'Payment'];

export const AuditFunnelPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        organizationName: '',
        email: '',
        portfolioContextCount: '',
        painPoints: '',
        dataMinimisationAcknowledged: false,
        ndaAccepted: false,
    });

    const stepName = STEPS[currentStep];

    const handleNext = () => {
        setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
        window.scrollTo(0, 0);
    };
    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        window.scrollTo(0, 0);
    };

    const handleSubmitScoping = async (e: React.FormEvent) => {
        e.preventDefault();
        handleNext(); // Move to Trust/Security
    };

    const handleSubmitTrust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.dataMinimisationAcknowledged || !formData.ndaAccepted) return;

        setLoading(true);
        // Save initial lead to database
        try {
            const { error } = await supabase.from('leads').insert({
                email: formData.email,
                organization_name: formData.organizationName,
                portfolio_context_count: formData.portfolioContextCount ? parseInt(formData.portfolioContextCount, 10) : null,
                primary_pain_point: formData.painPoints,
                data_minimisation_acknowledged: formData.dataMinimisationAcknowledged,
                nda_accepted: formData.ndaAccepted,
                audit_status: 'checkout_started'
            });
            if (error) throw error;
            handleNext(); // Move to What You're Commissioning
        } catch (err) {
            console.error('Error saving audit intent:', err);
            // Even if lead insert fails (e.g. duplicate email), we can proceed to payment for this demo
            handleNext(); 
        } finally {
            setLoading(false);
        }
    };

    const handleStripePayment = async () => {
        console.log('💳 Initiating Stripe Payment Flow...');
        console.log('User Email:', formData.email);
        
        setLoading(true);
        try {
            const origin = window.location.origin;
            console.log('Detected Origin:', origin);

            console.log('Invoking create-checkout Edge Function...');
            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { purchaser_email: formData.email }
            });

            if (error) {
                console.error('❌ Supabase Function Error:', error);
                throw error;
            }
            
            console.log('Response from create-checkout:', data);

            if (data?.url) {
                console.log('🚀 Redirecting to Stripe Checkout:', data.url);
                window.location.href = data.url;
            } else {
                console.error('❌ No URL returned from checkout session');
                throw new Error("Failed to create Checkout session");
            }
        } catch (err: any) {
            console.error('🔥 Stripe Payment Error:', err);
            alert('Failed to initiate checkout: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pt-24 pb-12 font-sans flex flex-col items-center">

            {/* Progress Header */}
            <div className="w-full max-w-3xl px-6 mb-8">
                <div className="flex justify-between items-center relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-action-blue -z-10 rounded-full transition-all duration-500"
                        style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                    ></div>

                    {STEPS.map((step, idx) => {
                        let displayName = step.replace(/_/g, ' ');
                        if (step === 'Security_Trust') displayName = 'Security & Trust';
                        if (step === 'What_Youre_Commissioning') displayName = "What You're Commissioning";

                        return (
                            <div key={step} className={`flex flex-col items-center gap-2 ${idx <= currentStep ? 'text-action-blue' : 'text-slate-600'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${idx < currentStep ? 'bg-action-blue text-white' : idx === currentStep ? 'bg-slate-900 border-2 border-action-blue text-action-blue' : 'bg-slate-900 border-2 border-slate-700 text-slate-500'}`}>
                                    {idx < currentStep ? <CheckCircle size={16} /> : idx + 1}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:block text-center">{displayName}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Content Container */}
            <div className="w-full max-w-2xl px-4 sm:px-6">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden shadow-black/50">

                    {/* STEP 1: SCOPING */}
                    {stepName === 'Scoping' && (
                        <form onSubmit={handleSubmitScoping} className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 sm:p-10">
                            <div className="mb-8">
                                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Strategic Scoping</h2>
                                <p className="text-slate-400">Tell us about your organization to help us prepare for your Capacity Audit.</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Organization Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all"
                                        placeholder="e.g. Ministry of Health"
                                        value={formData.organizationName}
                                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Work Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all"
                                        placeholder="you@agency.govt.nz"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Portfolio Context</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all"
                                        placeholder="e.g. 15"
                                        value={formData.portfolioContextCount}
                                        onChange={(e) => setFormData({ ...formData, portfolioContextCount: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-500 mt-2">Approximately how many initiatives are currently active or in planning? Used for session planning only — does not affect your capacity calculation.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Primary Governance Pain Point</label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all resize-none"
                                        placeholder="e.g. 'Everything is marked Priority 1, but delivery is stalling...'"
                                        value={formData.painPoints}
                                        onChange={(e) => setFormData({ ...formData, painPoints: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <button type="submit" className="bg-action-blue text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    Continue to Security <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 2: SECURITY & TRUST */}
                    {stepName === 'Security_Trust' && (
                        <form onSubmit={handleSubmitTrust} className="animate-in fade-in slide-in-from-right-8 duration-500 p-8 sm:p-10">
                            <div className="mb-8">
                                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2 flex items-center gap-3">
                                    <ShieldCheck className="text-green-400" size={32} /> Security & Trust
                                </h2>
                                <p className="text-slate-400">To maintain NZ Public Sector standards, please comply with our Data Minimization protocols before your session.</p>
                            </div>

                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 mb-8">
                                <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2"><Lock size={16} className="text-action-blue" /> Data Minimisation Checklist</h3>
                                <ul className="space-y-3 ms-2">
                                    <li className="flex gap-3 text-sm text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0"></div>
                                        <span>Remove all PII (Personally Identifiable Information) or specific citizen names from initiative descriptions.</span>
                                    </li>
                                    <li className="flex gap-3 text-sm text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0"></div>
                                        <span>Obfuscate specific financial totals (e.g. use "High/Med/Low" instead of exact operational budgets if restricted).</span>
                                    </li>
                                    <li className="flex gap-3 text-sm text-slate-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0"></div>
                                        <span>Abstract sensitive third-party vendor names or explicit server IPs.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-start gap-4 p-4 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/30 transition-colors">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            required
                                            className="w-5 h-5 rounded border-slate-600 text-action-blue focus:ring-action-blue focus:ring-offset-slate-900 bg-slate-900"
                                            checked={formData.dataMinimisationAcknowledged}
                                            onChange={(e) => setFormData({ ...formData, dataMinimisationAcknowledged: e.target.checked })}
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <span className="block font-bold text-slate-200 mb-1">I acknowledge the Data Minimisation protocols</span>
                                        <span className="text-slate-500">I will ensure the data brought to the Slot-Sync session has been scrubbed of sensitive PII.</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-4 p-4 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/30 transition-colors">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            required
                                            className="w-5 h-5 rounded border-slate-600 text-action-blue focus:ring-action-blue focus:ring-offset-slate-900 bg-slate-900"
                                            checked={formData.ndaAccepted}
                                            onChange={(e) => setFormData({ ...formData, ndaAccepted: e.target.checked })}
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <span className="block font-bold text-slate-200 mb-1">I accept the AlturaGov Mutual NDA</span>
                                        <span className="text-slate-500">I agree to the terms outlined in the <a href="#" target="_blank" className="text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>Standard Mutual NDA</a> to protect both parties.</span>
                                    </div>
                                </label>
                            </div>

                            <div className="mt-10 flex justify-between items-center">
                                <button type="button" onClick={handlePrev} className="text-slate-400 font-bold hover:text-white transition-colors">
                                    Back
                                </button>
                                <button disabled={loading} type="submit" className="bg-action-blue text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? 'Processing...' : 'Continue'} <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: WHAT YOU'RE COMMISSIONING */}
                    {stepName === 'What_Youre_Commissioning' && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 p-8 sm:p-10">
                            <div className="mb-8">
                                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-6">
                                    What You're Commissioning
                                </h2>
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-xl">
                                        <p className="text-slate-300 leading-relaxed">
                                            <strong className="text-white">What Your Audit Delivers:</strong> Based on your portfolio scope, AlturaGov will map your current initiative load against your organisation's realistic delivery capacity — producing an objective, quantified assessment of where your strategy is exposed.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-xl">
                                        <p className="text-slate-300 leading-relaxed">
                                            You will receive a Strategic Capacity Report that identifies which programmes are structurally at risk, where capacity is being consumed by low-value work, and what your organisation can credibly commit to delivering.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-xl">
                                        <p className="text-slate-300 leading-relaxed">
                                            The process is straightforward. Once payment is confirmed, you'll schedule a 60-minute Slot-Sync Session. This is a focused working session — not a sales call — where we align on your portfolio inputs and agree the parameters of the assessment. Your report follows within five working days. Everything produced is covered by the Mutual NDA you reviewed in the previous step.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 flex justify-between items-center">
                                <button type="button" onClick={handlePrev} className="text-slate-400 font-bold hover:text-white transition-colors">
                                    Back
                                </button>
                                <button onClick={handleNext} className="bg-action-blue text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    Proceed to Payment <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: PAYMENT */}
                    {stepName === 'Payment' && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 p-8 sm:p-10">
                            <div className="mb-8 border-b border-slate-800 pb-8 text-center">
                                <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4 flex items-center justify-center gap-3">
                                    <CreditCard className="text-action-blue" size={32} /> Secure Checkout
                                </h2>
                                <div className="text-5xl font-mono font-bold text-white mb-2">$1,950 <span className="text-xl text-slate-500">NZD + GST</span></div>
                                <p className="text-strategic-gold font-bold uppercase tracking-widest text-sm">Strategic Capacity Audit</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="bg-slate-950/50 p-6 border border-slate-800 rounded-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <Lock size={100} />
                                    </div>
                                    <h4 className="font-bold text-slate-200 mb-2">Secure Payment via Stripe</h4>
                                    <p className="text-sm text-slate-400 mb-6 font-medium leading-relaxed">You are being redirected to Stripe for secure payment processing. Once complete, you will return to book your Slot-Sync Session.</p>

                                    <button
                                        onClick={handleStripePayment}
                                        disabled={loading}
                                        className="w-full bg-action-blue text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Lock size={18} /> Complete Secure Checkout</>}
                                    </button>
                                    
                                    <div className="flex items-center justify-center gap-4 mt-6 grayscale opacity-50">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure Payments via Stripe</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                                <button type="button" onClick={handlePrev} className="text-slate-500 font-bold hover:text-slate-300 transition-colors text-sm">
                                    Back to scope
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
