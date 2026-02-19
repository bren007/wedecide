import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';

interface StrategicPillar {
    id: string;
    title: string;
}

export const InitiativeProposalPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [pillars, setPillars] = useState<StrategicPillar[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [pillarId, setPillarId] = useState('');
    const [focusSlots, setFocusSlots] = useState(3);
    const [capex, setCapex] = useState(0);
    const [opex, setOpex] = useState(0);
    const [shortTermWin, setShortTermWin] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch pillars on mount
    useEffect(() => {
        const fetchPillars = async () => {
            const { data, error } = await supabase
                .from('strategic_pillars' as any)
                .select('id, title');

            if (!error && data) {
                setPillars(data as unknown as StrategicPillar[]);
            }
        };
        fetchPillars();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get user's org_id (helper function would be better, but fetching from user metadata or profile is needed)
            // For now, let's assume the RLS handles the connection validation or we fetch the user's org.
            // Actually, we need to explicitly send org_id for the insert to work if RLS requires it in the check?
            // The RLS says: WITH CHECK (org_id = get_auth_user_org_id());
            // So we DO need to send the org_id.

            // Let's quickly fetch the user's org_id
            const { data: userData, error: userError } = await supabase
                .from('users' as any)
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (userError || !userData) throw new Error('Could not fetch user organization');

            const orgId = (userData as any).organization_id;

            const { error: insertError } = await supabase
                .from('initiatives' as any)
                .insert({
                    org_id: orgId,
                    owner_id: user.id,
                    title,
                    strategic_pillar_id: pillarId || null,
                    focus_slots: focusSlots,
                    capex_required: capex,
                    opex_required: opex,
                    short_term_win: shortTermWin,
                    status: 'proposed'
                });

            if (insertError) throw insertError;

            navigate('/command-center');
        } catch (err: any) {
            console.error('Error proposing initiative:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy-900 text-slate-300 p-8 font-sans flex justify-center">
            <div className="w-full max-w-2xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Propose Initiative</h1>
                    <p className="text-slate-400">Submit a new initiative for strategic review.</p>
                </header>

                <form onSubmit={handleSubmit} className="bg-navy-800 border border-navy-700 rounded-lg p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Initiative Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="e.g., Q3 Marketing Campaign"
                        />
                    </div>

                    {/* Strategic Pillar */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Strategic Pillar <span className="text-red-400">*</span></label>
                        <select
                            required
                            value={pillarId}
                            onChange={e => setPillarId(e.target.value)}
                            className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">-- Select a Strategic Pillar --</option>
                            {pillars.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">All initiatives must anchor to a strategic pillar.</p>
                    </div>

                    {/* Focus Slots */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Focus Slots Required</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={focusSlots}
                                onChange={e => setFocusSlots(Number(e.target.value))}
                                className="flex-1"
                            />
                            <span className="font-mono text-xl font-bold text-white w-8 text-center">{focusSlots}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Estimated cognitive load (1-10)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CAPEX */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">CAPEX Requirement ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={capex}
                                onChange={e => setCapex(Number(e.target.value))}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* OPEX */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">OPEX Requirement ($)</label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={opex}
                                onChange={e => setOpex(Number(e.target.value))}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Short Term Win */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="shortTermWin"
                            checked={shortTermWin}
                            onChange={e => setShortTermWin(e.target.checked)}
                            className="w-5 h-5 rounded border-navy-700 bg-navy-900 text-blue-500 focus:ring-blue-500"
                        />
                        <label htmlFor="shortTermWin" className="text-sm font-medium text-slate-300">
                            This is a "Short Term Win" (Quick delivery, high impact)
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate('/command-center')}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={loading}>Submit Proposal</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
