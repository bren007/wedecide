import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, CheckCircle, ShieldCheck, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STEPS = ['Scoping', 'Security_Trust', 'What_Youre_Commissioning', 'Payment', 'Scheduling'];

const CalendlyMock = ({ bookingEmail, organizationName }: { bookingEmail: string, organizationName: string }) => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [booked, setBooked] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await supabase.rpc('update_lead_by_email', {
                p_email: bookingEmail,
                p_status: 'payment_secured'
            });

            // Trigger Edge Function to send email
            try {
                await supabase.functions.invoke('send-preflight-email', {
                    body: { email: bookingEmail, organizationName }
                });
            } catch (e) {
                console.warn('Edge function invoke failed (mock expected in dev):', e);
            }

            setBooked(true);
        } catch (err) {
            console.error('Failed to book session:', err);
            alert('Failed to book. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (booked) {
        return (
            <div className="bg-white rounded-xl overflow-hidden shadow-xl w-full max-w-2xl mx-auto p-12 text-center text-slate-800 animate-in zoom-in duration-500">
                <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
                <h3 className="text-3xl font-extrabold text-slate-900 mb-2">You are scheduled</h3>
                <p className="text-slate-600 mb-8 font-medium">A calendar invitation has been sent to your email address.</p>
                <button onClick={() => { navigate('/'); window.scrollTo(0, 0); }} className="px-8 py-3 bg-action-blue text-white rounded-full font-bold shadow hover:bg-blue-600 transition-colors">
                    Return to AlturaGov
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-xl w-full max-w-4xl mx-auto flex flex-col md:flex-row text-slate-800 border border-slate-200">
            <div className="w-full md:w-1/3 border-r border-slate-200 p-8 flex flex-col items-start text-left bg-slate-50/50">
                <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">AlturaGov</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Strategic Capacity Audit</h3>
                <div className="text-slate-600 mb-3 flex items-center gap-3 font-medium">
                    <span className="text-lg">🕒</span> 60 min
                </div>
                <div className="text-slate-600 mb-3 flex items-center gap-3 font-medium">
                    <span className="text-lg">🎥</span> Web conferencing details provided upon confirmation.
                </div>
                <p className="text-sm text-slate-500 mt-6 leading-relaxed">Book your Slot-Sync Session to calibrate your engine constraints.</p>
            </div>

            <div className="w-full md:w-2/3 p-8 flex flex-col min-h-[400px]">
                {!selectedDate ? (
                    <div className="w-full animate-in fade-in">
                        <h4 className="font-bold text-xl mb-6 text-left">Select a Date & Time</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {['Tomorrow', 'Wednesday', 'Friday'].map(d => (
                                <button key={d} onClick={() => setSelectedDate(d)} className="p-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-action-blue hover:text-action-blue bg-white transition-all text-center focus:ring-4 focus:ring-blue-100 outline-none">
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : !selectedTime ? (
                    <div className="w-full animate-in fade-in slide-in-from-right-4">
                        <button onClick={() => setSelectedDate(null)} className="text-sm text-action-blue mb-6 font-bold flex items-center gap-1 hover:underline">← Back</button>
                        <h4 className="font-bold text-xl mb-6 text-left">{selectedDate}</h4>
                        <div className="flex flex-col gap-3">
                            {['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'].map(t => (
                                <button key={t} onClick={() => setSelectedTime(t)} className="p-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-action-blue hover:text-action-blue bg-white transition-all text-left focus:ring-4 focus:ring-blue-100 outline-none flex justify-between">
                                    <span>{t}</span>
                                    <span className="text-action-blue opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">Select</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in slide-in-from-right-4 flex flex-col items-center justify-center flex-1">
                        <h4 className="font-bold text-2xl mb-2 text-slate-900">Confirm Booking</h4>
                        <p className="text-slate-500 mb-8 font-medium">{selectedDate} at {selectedTime}</p>
                        <div className="flex gap-4">
                            <button onClick={() => setSelectedTime(null)} disabled={loading} className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-full font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">
                                Back
                            </button>
                            <button onClick={handleConfirm} disabled={loading} className="px-8 py-3 bg-action-blue text-white rounded-full font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[150px] disabled:opacity-50 disabled:transform-none">
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Confirm Event'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const AuditFunnelPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        organizationName: '',
        email: '',
        portfolioScale: '',
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
                portfolio_scale: formData.portfolioScale,
                primary_pain_point: formData.painPoints,
                data_minimisation_acknowledged: formData.dataMinimisationAcknowledged,
                nda_accepted: formData.ndaAccepted,
                audit_status: 'checkout_started'
            });
            if (error) throw error;
            handleNext(); // Move to Payment
        } catch (err) {
            console.error('Error saving audit intent:', err);
            alert('Failed to save your progress. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMockPayment = async () => {
        setLoading(true);
        // Simulate Stripe
        setTimeout(() => {
            setLoading(false);
            handleNext(); // Move to Scheduling
        }, 1500);
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
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Current Portfolio Scale</label>
                                    <select
                                        required
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all"
                                        value={formData.portfolioScale}
                                        onChange={(e) => setFormData({ ...formData, portfolioScale: e.target.value })}
                                    >
                                        <option value="" disabled>Select scale...</option>
                                        <option value="1-10">1-10 Active Strategic Initiatives</option>
                                        <option value="11-25">11-25 Active Strategic Initiatives</option>
                                        <option value="26-50">26-50 Active Strategic Initiatives</option>
                                        <option value="50+">50+ Active Strategic Initiatives</option>
                                    </select>
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

                    {/* STEP 3: PAYMENT */}
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
                                    <h4 className="font-bold text-slate-200 mb-2">Checkout Mockup</h4>
                                    <p className="text-sm text-slate-400 mb-4">In production, this step will redirect to a secure Stripe Checkout session. For this MVP, click the mock button below to simulate a successful payment.</p>

                                    <button
                                        onClick={handleMockPayment}
                                        disabled={loading}
                                        className="w-full bg-[#635BFF] text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-[#5249ea] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Lock size={16} /> Pay $1,950 via Stripe Mock</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SCHEDULING */}
                    {stepName === 'Scheduling' && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 p-8 sm:p-10 text-center">
                            <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Payment Confirmed</h2>
                            <p className="text-slate-400 max-w-md mx-auto mb-10">
                                Your Strategic Capacity Audit is booked. Please select a time for your 60-minute remote Slot-Sync Session to calibrate your engine.
                            </p>

                            <div className="w-full max-w-4xl mx-auto rounded-xl p-2 mb-8 border border-slate-800 bg-slate-900/50">
                                <CalendlyMock bookingEmail={formData.email} organizationName={formData.organizationName} />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
