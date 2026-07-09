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
    // Complexity Calculator
    const [stakeholderFriction, setStakeholderFriction] = useState(1);
    const [noveltyTech, setNoveltyTech] = useState(1);
    const [dependencyDepth, setDependencyDepth] = useState(1);

    const calculateFocusSlots = () => {
        const totalScore = stakeholderFriction + noveltyTech + dependencyDepth;
        if (totalScore <= 5) return 1;
        if (totalScore <= 10) return 3;
        return 5;
    };
    const focusSlots = calculateFocusSlots();
    const [capexCurrent, setCapexCurrent] = useState(0);
    const [opexCurrent, setOpexCurrent] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [isMultiYear, setIsMultiYear] = useState(false);
    const [futureOpex, setFutureOpex] = useState(0);
    const [shortTermWin, setShortTermWin] = useState(false);
    const [approvalMandate, setApprovalMandate] = useState('');
    const [relativePriority, setRelativePriority] = useState('');
    const [targetQuarter, setTargetQuarter] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Fetch pillars on mount
    useEffect(() => {
        const fetchPillars = async () => {
            const { data, error } = await supabase
                .from('strategic_pillars' as unknown)
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
                .from('users' as unknown)
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (userError || !userData) throw new Error('Could not fetch user organization');

            const orgId = (userData as unknown).organization_id;

            const { error: insertError } = await supabase
                .from('initiatives' as unknown)
                .insert({
                    org_id: orgId,
                    owner_id: user.id,
                    title,
                    strategic_pillar_id: pillarId || null,
                    focus_slots: focusSlots,
                    complexity_stakeholder: stakeholderFriction,
                    complexity_tech: noveltyTech,
                    complexity_dependency: dependencyDepth,
                    capex_current_fy: capexCurrent,
                    opex_current_fy: opexCurrent,
                    total_initiative_cost: totalCost,
                    is_multi_year: isMultiYear,
                    future_annual_opex: isMultiYear ? futureOpex : 0,
                    short_term_win: shortTermWin,
                    approval_mandate: approvalMandate || null,
                    relative_priority: relativePriority || null,
                    target_delivery_quarter: targetQuarter || null,
                    current_fy_budget: capexCurrent + opexCurrent,
                    status: 'proposed'
                });

            if (insertError) throw insertError;

            navigate('/command-center');
        } catch (err: unknown) {
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

                    {/* Governance Classification */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Approval Mandate <span className="text-red-400">*</span></label>
                            <select
                                required
                                value={approvalMandate}
                                onChange={e => setApprovalMandate(e.target.value)}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">-- Select --</option>
                                <option value="Cabinet Approved">Cabinet Approved</option>
                                <option value="Ministerial Approved">Ministerial Approved</option>
                                <option value="Board/Delegated">Board/Delegated</option>
                                <option value="Pre-Approval">Pre-Approval</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Relative Priority <span className="text-red-400">*</span></label>
                            <select
                                required
                                value={relativePriority}
                                onChange={e => setRelativePriority(e.target.value)}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">-- Select --</option>
                                <option value="Tier 1">Tier 1</option>
                                <option value="Tier 2">Tier 2</option>
                                <option value="Tier 3">Tier 3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Target Delivery Quarter <span className="text-red-400">*</span></label>
                            <select
                                required
                                value={targetQuarter}
                                onChange={e => setTargetQuarter(e.target.value)}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">-- Select --</option>
                                <option value="Q1 FY26">Q1 FY26</option>
                                <option value="Q2 FY26">Q2 FY26</option>
                                <option value="Q3 FY26">Q3 FY26</option>
                                <option value="Q4 FY26">Q4 FY26</option>
                                <option value="Q1 FY27">Q1 FY27</option>
                                <option value="Q2 FY27">Q2 FY27</option>
                                <option value="Q3 FY27">Q3 FY27</option>
                                <option value="Q4 FY27">Q4 FY27</option>
                            </select>
                        </div>
                    </div>

                    {/* Complexity Calculator */}
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-200">Complexity Calculator</h3>
                                <p className="text-xs text-slate-400">Anchor capacity to the physics of delivery.</p>
                            </div>
                            <div className="bg-action-blue/20 p-3 rounded-lg border border-action-blue/50 text-center flex flex-col items-center justify-center min-w-[100px]">
                                <span className="font-mono text-3xl font-bold text-action-blue leading-none">{focusSlots}</span>
                                <span className="text-[10px] uppercase font-bold text-action-blue tracking-wider mt-1">Focus Slots</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Stakeholder Friction</label>
                            <select
                                value={stakeholderFriction}
                                onChange={e => setStakeholderFriction(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value={1}>Internal / Single Team (1 pt)</option>
                                <option value={3}>Multi-Dept Protocol (3 pts)</option>
                                <option value={5}>Ministerial / Public Scrutiny (5 pts)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Novelty & Tech</label>
                            <select
                                value={noveltyTech}
                                onChange={e => setNoveltyTech(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value={1}>Business As Usual / Known Process (1 pt)</option>
                                <option value={3}>New Integration / Pattern Upgrade (3 pts)</option>
                                <option value={5}>First-of-kind / R&D (5 pts)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Dependency Depth</label>
                            <select
                                value={dependencyDepth}
                                onChange={e => setDependencyDepth(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value={1}>Standalone System (1 pt)</option>
                                <option value={3}>1-2 Downstream Links (3 pts)</option>
                                <option value={5}>Critical Path for 3+ Systems (5 pts)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CAPEX */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">CAPEX (Current FY)</label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={capexCurrent}
                                onChange={e => setCapexCurrent(Number(e.target.value))}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* OPEX */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">OPEX (Current FY)</label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={opexCurrent}
                                onChange={e => setOpexCurrent(Number(e.target.value))}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Total Cost */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Total Initiative Cost (Lifetime) <span className="text-red-400">*</span></label>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                required
                                value={totalCost}
                                onChange={e => setTotalCost(Number(e.target.value))}
                                className="w-full bg-navy-900 border border-navy-700 rounded px-4 py-2 text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Fiscal Tail / Multi-Year */}
                    <div className="flex flex-col gap-4 border-t border-navy-700 pt-6">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isMultiYear"
                                checked={isMultiYear}
                                onChange={e => setIsMultiYear(e.target.checked)}
                                className="w-5 h-5 rounded border-navy-700 bg-navy-900 text-blue-500 focus:ring-blue-500"
                            />
                            <label htmlFor="isMultiYear" className="text-sm font-medium text-slate-300">
                                This is a Multi-Year Initiative (Spans beyond Current FY)
                            </label>
                        </div>

                        {isMultiYear && (
                            <div className="pl-8">
                                <label className="block text-sm font-medium text-purple-300 mb-1">Future Annual OPEX ("Fiscal Tail")</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={futureOpex}
                                    onChange={e => setFutureOpex(Number(e.target.value))}
                                    className="w-full max-w-sm bg-navy-900 border border-purple-900/50 rounded px-4 py-2 text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Estimated recurring "keep the lights on" cost after delivery.</p>
                            </div>
                        )}
                    </div>

                    {/* Short Term Win */}
                    <div className="flex items-center gap-3 border-t border-navy-700 pt-6">
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
