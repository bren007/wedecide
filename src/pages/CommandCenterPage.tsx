import React, { useMemo } from 'react';
import { useSandboxState } from '../hooks/useSandboxState';
import { ArrowRight, Save, CirclePause, TriangleAlert, Zap, Clock, LayoutDashboard, ListFilter } from 'lucide-react';
import { Button } from '../components/Button';

// --- VISUAL HELPERS ---

const formatK = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
};

const FocusPill = ({ slots }: { slots: number }) => (
    <div className="flex gap-1 items-center" title={`Cognitive Load: ${slots}/10`}>
        {[...Array(10)].map((_, i) => (
            <div
                key={i}
                className={`w-1.5 h-4 rounded-full transition-all duration-300 ${i < slots ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-700/30'}`}
            />
        ))}
    </div>
);

const EmptyState = ({ icon: Icon, title, message, action }: any) => (
    <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 p-8 text-center mt-4">
        <div className="mb-4 p-4 bg-slate-800/50 rounded-full ring-1 ring-slate-700">
            <Icon size={32} className="opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-400 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-4">{message}</p>
        {action}
    </div>
);

// --- MAIN COMPONENT ---

export const CommandCenterPage: React.FC = () => {
    const {
        currentFocusLoad,
        focusLimit,
        currentCapexLoad,
        capexLimit,
        currentOpexLoad,
        opexLimit,
        isOverFocus,
        isOverCapex,
        isOverOpex,
        initiatives,
        pillarsMap,
        loading,
        error,
        moveInitiative,
        commitChanges,
        hasChanges,
        saving
    } = useSandboxState();

    const proposedList = useMemo(() =>
        initiatives.filter(i => ['proposed', 'paused'].includes(i.status)),
        [initiatives]);

    const activeList = useMemo(() =>
        initiatives.filter(i => ['active', 'approved'].includes(i.status)),
        [initiatives]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300 pt-24">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-lg font-medium animate-pulse">Initializing Command Center...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-red-400 pt-24">
            <div className="p-8 bg-slate-900 rounded-xl border border-red-900/50 shadow-2xl flex flex-col items-center gap-4">
                <TriangleAlert size={48} />
                <div className="text-xl font-bold">System Error</div>
                <p className="text-slate-400">{error}</p>
                <Button onClick={() => window.location.reload()} variant="secondary">Reload System</Button>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-slate-950 text-slate-200 font-sans flex flex-col pt-24 overflow-hidden">

            {/* --- HEADER --- */}
            <header className="flex-none px-6 py-4 bg-slate-900/95 border-b border-slate-800 flex justify-between items-center z-30 backdrop-blur-xl shadow-lg mt-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                        <LayoutDashboard size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight leading-none shadow-black drop-shadow-md">Command Center</h1>
                        <p className="text-[11px] text-blue-400 uppercase tracking-widest font-bold mt-1">Strategic Governance Engine</p>
                    </div>
                </div>

                {/* Physics Engine (Gauges) */}
                <div className="hidden xl:flex items-center gap-8 px-8 py-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                    <Gauge label="Focus Load" value={currentFocusLoad} limit={focusLimit} isOver={isOverFocus} unit="" />
                    <div className="w-px h-10 bg-slate-800"></div>
                    <Gauge label="CAPEX" value={currentCapexLoad} limit={capexLimit} isOver={isOverCapex} unit="$" format={formatK} />
                    <div className="w-px h-10 bg-slate-800"></div>
                    <Gauge label="OPEX" value={currentOpexLoad} limit={opexLimit} isOver={isOverOpex} unit="$" format={formatK} />
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={commitChanges}
                        disabled={!hasChanges || saving}
                        variant={hasChanges ? 'primary' : 'secondary'}
                        className={`transition-all duration-300 ${hasChanges ? 'shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105 border-blue-500 ring-1 ring-blue-400/50' : 'opacity-50 grayscale border-slate-700'}`}
                    >
                        <Save size={16} className="mr-2" />
                        {saving ? 'Committing...' : hasChanges ? 'Commit Changes' : 'No Changes'}
                    </Button>
                </div>
            </header>

            {/* --- MAIN BOARD --- */}
            <div className="flex-1 min-h-0 p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1920px] mx-auto w-full">

                {/* LEFT COLUMN: BACKLOG */}
                <Column
                    title="Proposed / Backlog"
                    count={proposedList.length}
                    color="blue"
                    headerAction={
                        <div className="flex gap-2">
                            <a href="/strategic-ingestion" className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 border border-slate-700/50 hover:border-slate-600 bg-slate-900 shadow-sm">
                                <ListFilter size={14} /> CSV Import
                            </a>
                            <a href="/propose-initiative" className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/20 hover:border-blue-500/30 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                + New Proposal
                            </a>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {proposedList.map(init => (
                            <InitiativeCard
                                key={init.id}
                                data={init}
                                pillarName={pillarsMap[init.strategic_pillar_id || ''] || 'Unassigned'}
                                onMove={() => moveInitiative(init.id, 'active')}
                                variant="proposed"
                                actionIcon={ArrowRight}
                            />
                        ))}
                        {proposedList.length === 0 && (
                            <EmptyState
                                icon={Zap}
                                title="Backlog Empty"
                                message="All clear! Add new initiatives or import from CSV to populate the backlog."
                                action={
                                    <a href="/propose-initiative" className="text-sm text-blue-400 font-medium hover:underline mt-2 inline-block">
                                        Create First Initiative
                                    </a>
                                }
                            />
                        )}
                    </div>
                </Column>

                {/* RIGHT COLUMN: ACTIVE FLIGHT */}
                <Column
                    title="Active / In Flight"
                    count={activeList.length}
                    color="green"
                    isOverLimit={isOverFocus || isOverCapex || isOverOpex}
                >
                    {/* Overflow Banner */}
                    {(isOverFocus || isOverCapex || isOverOpex) && (
                        <div className="mb-6 bg-red-950/40 border border-red-500/50 text-red-200 text-sm font-bold px-6 py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 animate-pulse ring-1 ring-red-500/20">
                            <TriangleAlert size={20} className="text-red-500" />
                            CAPACITY EXCEEDED - SWAP OUT ITEMS TO RESOLVE
                        </div>
                    )}

                    <div className={`space-y-4 transition-opacity duration-300 ${(isOverFocus || isOverCapex || isOverOpex) ? 'opacity-80 grayscale-[0.3]' : ''}`}>
                        {activeList.map(init => (
                            <InitiativeCard
                                key={init.id}
                                data={init}
                                pillarName={pillarsMap[init.strategic_pillar_id || ''] || 'Unassigned'}
                                onMove={() => moveInitiative(init.id, 'paused')}
                                variant="active"
                                actionIcon={CirclePause}
                            />
                        ))}
                        {activeList.length === 0 && (
                            <EmptyState
                                icon={LayoutDashboard}
                                title="Capacity Available"
                                message="The engine is idle. Activate initiatives from the backlog to fill capacity."
                            />
                        )}
                    </div>
                </Column>

            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const Gauge = ({ label, value, limit, isOver, unit, format }: any) => {
    // Determine color based on usage %
    const percent = Math.min((value / limit) * 100, 100);
    const colorClass = isOver ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : percent > 90 ? 'text-yellow-400' : 'text-slate-100';

    return (
        <div className={`flex flex-col items-center min-w-[120px] ${isOver ? 'animate-pulse' : ''}`}>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">{label}</span>
            <div className={`font-mono text-xl font-bold leading-none flex items-baseline gap-1 ${colorClass}`}>
                {format ? format(value) : value}
                <span className="text-slate-600 text-xs font-medium ml-0.5">/ {format ? format(limit) : limit}</span>
            </div>
        </div>
    );
};

const Column = ({ title, count, color, children, headerAction, isOverLimit }: any) => (
    <div className={`flex flex-col h-full rounded-2xl border bg-slate-900/50 overflow-hidden shadow-2xl backdrop-blur-sm
        ${isOverLimit ? 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]' : `border-slate-800`}
    `}>
        <div className={`px-6 py-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/80`}>
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ring-4 ring-opacity-20 ${color === 'green' ? 'bg-green-500 ring-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-blue-500 ring-blue-500 shadow-[0_0_10px_#3b82f6]'}`}></div>
                <h2 className="font-bold text-slate-100 tracking-tight text-lg shadow-black drop-shadow-sm">{title}</h2>
                <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold border ${color === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                    {count}
                </span>
            </div>
            {headerAction}
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">
            {children}
        </div>
    </div>
);

const InitiativeCard = ({ data, pillarName, onMove, actionIcon: Icon, variant }: any) => {
    const isProposed = variant === 'proposed';

    return (
        <div className="group relative bg-[#182030] border border-slate-700/60 rounded-xl p-5 shadow-lg hover:border-slate-500 hover:shadow-2xl hover:bg-[#1e273b] transition-all duration-200 hover:-translate-y-1">
            {/* Left Accent Bar */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-colors duration-300 ${isProposed ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'}`}></div>

            <div className="pl-5">
                {/* Header: Title & Quick Win */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-100 text-base leading-snug pr-4 tracking-tight">{data.title}</h3>
                    {data.short_term_win && (
                        <div className="shrink-0 text-green-400 bg-green-500/10 p-1.5 rounded-md border border-green-500/20" title="Quick Win">
                            <Clock size={14} />
                        </div>
                    )}
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mb-5">
                    {/* Strategy Badge */}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 shadow-sm">
                        {pillarName}
                    </span>

                    {/* Load Pill */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 rounded-md border border-slate-700 shadow-sm">
                        <Zap size={12} className={isProposed ? "text-blue-400" : "text-green-400"} />
                        <FocusPill slots={data.focus_slots} />
                    </div>
                </div>

                {/* Footer: Financial & Action */}
                <div className="flex justify-between items-end border-t border-slate-700/50 pt-4 mt-2">
                    <div className="flex gap-6 text-xs font-mono text-slate-500">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-600 mb-0.5">Capex</span>
                            <span className="text-slate-300 font-bold text-sm">{formatK(data.capex_required)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-600 mb-0.5">Opex</span>
                            <span className="text-slate-300 font-bold text-sm">{formatK(data.opex_required)}</span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onMove(); }}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md group-hover:scale-105 active:scale-95
                            ${isProposed
                                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500'}
                        `}
                    >
                        {isProposed ? 'Activate' : 'Park'}
                        <Icon size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
