import { useMemo, useState } from 'react';
import { useSandboxState } from '../hooks/useSandboxState';
import { ArrowRight, Save, CirclePause, TriangleAlert, Zap, Clock, LayoutDashboard, ListFilter, Check, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { MeetingControls } from '../components/MeetingControls';
import { useMeetingState } from '../hooks/useMeetingState';
import { CommitModal } from '../components/CommitModal';
import { InfoTooltip } from '../components/InfoTooltip';
import { AuditImportPrompt } from '../components/AuditImportPrompt';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

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

// --- MAIN PAGE ---

export const CommandCenterPage = () => {
    const {
        initiatives,
        pillarsMap,
        loading,
        error,
        saving,
        hasChanges,
        moveInitiative,
        updateInitiativeQuarter,
        commitChanges,
        currentFocusLoad,
        focusLimit,
        isOverFocus,
        currentCapexLoad,
        capexLimit,
        isOverCapex,
        currentOpexLoad,
        opexLimit,
        isOverOpex,
        currentFutureOpexLoad,
        fiscalDrag,
        fiscalDragThreshold,
        isOverFiscalDrag,
        quarterlyFocusLoad
    } = useSandboxState();

    const {
        currentMeeting,
        loading: meetingLoading,
        startMeeting,
        endMeeting
    } = useMeetingState();

    const [isCommitOpen, setIsCommitOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [hasSkippedImport, setHasSkippedImport] = useState(false);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const handleCommit = () => {
        if (!hasChanges) return;
        setIsCommitOpen(true);
    };

    const executeCommit = async (rationale: string) => {
        await commitChanges(rationale);
        setIsCommitOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const proposedList = useMemo(() =>
        initiatives.filter(i => ['proposed', 'paused'].includes(i.status)),
        [initiatives]);

    const activeList = useMemo(() =>
        initiatives.filter(i => ['active', 'approved'].includes(i.status)),
        [initiatives]);

    // Group active list by quarter
    const quarters = ['Q1 FY26', 'Q2 FY26', 'Q3 FY26', 'Q4 FY26'];
    const quarterLists = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        quarters.forEach(q => grouped[q] = []);
        activeList.forEach(i => {
            const q = i.target_delivery_quarter || 'Q1 FY26'; // Default to first if unsequenced
            if (grouped[q]) grouped[q].push(i);
            else grouped[quarters[0]].push(i); // Failsafe
        });
        return grouped;
    }, [activeList]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const item = initiatives.find(i => i.id === active.id);
        if (item) setActiveDragItem(item);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const sourceId = String(active.id);
        const targetContainer = String(over.id); // e.g. "backlog", "Q1 FY26", etc.

        const item = initiatives.find(i => i.id === sourceId);
        if (!item) return;

        if (targetContainer === 'backlog') {
            if (['active', 'approved'].includes(item.status)) {
                moveInitiative(sourceId, 'paused');
            }
        } else if (quarters.includes(targetContainer)) {
            if (['proposed', 'paused'].includes(item.status)) {
                moveInitiative(sourceId, 'active');
            }
            // Always update quarter if dropped in a quarter lane
            updateInitiativeQuarter(sourceId, targetContainer);
        }
    };

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
        <div className="flex flex-col h-screen overflow-hidden bg-slate-950">

            {/* --- TOP HEADER --- */}
            <header className="shrink-0 bg-slate-900/80 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 z-40 backdrop-blur-md shadow-lg">...

                {/* METRICS GAUGES */}
                <div className="flex items-center bg-slate-950/50 rounded-xl border border-slate-800/80 p-2 shadow-inner">
                    <Gauge
                        label="Peak Focus Load"
                        value={currentFocusLoad}
                        limit={focusLimit}
                        isOver={isOverFocus}
                        tooltip="The maximum Focus Slot demand across any single upcoming quarter. The Capacity Baseline represents the limits of governance capacity before structural delivery failure occurs."
                    />
                    <div className="w-px h-10 bg-slate-800 mx-2"></div>
                    <Gauge
                        label="Fiscal Drag"
                        value={fiscalDrag}
                        limit={fiscalDragThreshold || 0}
                        isOver={isOverFiscalDrag}
                        format={formatK}
                        noLimit={fiscalDragThreshold == null}
                        tooltip="The quantum of current-year budget currently committed to Tier 2 and Tier 3 initiatives — budget structurally unavailable to Tier 1 priorities."
                    />
                    <div className="w-px h-10 bg-slate-800 mx-2"></div>
                    <Gauge
                        label="Active Capex"
                        value={currentCapexLoad}
                        limit={capexLimit}
                        isOver={isOverCapex}
                        format={formatK}
                    />
                    <div className="w-px h-10 bg-slate-800 mx-2"></div>
                    <Gauge
                        label="Active Opex"
                        value={currentOpexLoad}
                        limit={opexLimit}
                        isOver={isOverOpex}
                        format={formatK}
                        ghostValue={currentFutureOpexLoad}
                    />
                </div>

                {/* MEETING CONTROLS & COMMIT */}
                <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
                    <MeetingControls
                        meeting={currentMeeting}
                        loading={meetingLoading}
                        onStart={() => startMeeting()}
                        onEnd={() => endMeeting()}
                    />
                    <Button
                        variant={hasChanges ? 'primary' : 'secondary'}
                        onClick={handleCommit}
                        disabled={!hasChanges || saving}
                        isLoading={saving}
                        className={hasChanges ? 'animate-pulse bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : ''}
                    >
                        <Save size={16} className="mr-2" />
                        {saving ? 'Committing...' : hasChanges ? 'Commit Changes' : 'No Changes'}
                    </Button>
                </div>
                {showSuccess && (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-bold animate-in fade-in slide-in-from-right-4 duration-300 px-2">
                        <Check size={16} /> Saved!
                    </div>
                )}
            </header>

            <CommitModal
                isOpen={isCommitOpen}
                onClose={() => setIsCommitOpen(false)}
                onCommit={executeCommit}
                saving={saving}
            />

            {/* --- MAIN BOARD --- */}
            {initiatives.length === 0 && !hasSkippedImport ? (
                <div className="flex-1 mt-12">
                    <AuditImportPrompt
                        onImportComplete={() => window.location.reload()}
                        onSkip={() => setHasSkippedImport(true)}
                    />
                </div>
            ) : (
                <div className="flex-1 min-h-0 pt-6 pb-6 px-6 overflow-x-auto custom-scrollbar w-full">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-6 h-full items-start min-w-max">
                            {/* BACKLOG COLUMN */}
                            <div className="w-[360px] h-full shrink-0 flex flex-col">
                                <Column
                                    id="backlog"
                                    title="Proposed / Backlog"
                                    count={proposedList.length}
                                    color="blue"
                                    headerAction={
                                        <div className="flex gap-2">
                                            <a href="/strategic-ingestion" className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 border border-slate-700/50 hover:border-slate-600 bg-slate-900 shadow-sm">
                                                <ListFilter size={14} /> Import
                                            </a>
                                            <a href="/propose-initiative" className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-2 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/20 hover:border-blue-500/30">
                                                + New
                                            </a>
                                        </div>
                                    }
                                >
                                    {proposedList.map(init => (
                                        <DraggableInitiativeCard
                                            key={init.id}
                                            data={init}
                                            pillarName={pillarsMap[init.strategic_pillar_id || ''] || 'Unassigned'}
                                            onMove={() => moveInitiative(init.id, 'active')}
                                            variant="proposed"
                                            actionIcon={ArrowRight}
                                            actionLabel="Activate"
                                        />
                                    ))}
                                    {proposedList.length === 0 && (
                                        <EmptyState
                                            icon={Zap}
                                            title="Backlog Empty"
                                            message="Add new initiatives or import from CSV."
                                        />
                                    )}
                                </Column>
                            </div>

                            {/* QUARTER COLUMNS */}
                            {quarters.map(q => {
                                const list = quarterLists[q];
                                const qLoad = quarterlyFocusLoad?.[q] || 0;
                                const isOver = qLoad > focusLimit;
                                return (
                                    <div key={q} className="w-[360px] h-full shrink-0 flex flex-col">
                                        <Column
                                            id={q}
                                            title={q}
                                            count={list.length}
                                            color="green"
                                            isOverLimit={isOver}
                                            headerAction={
                                                <div className={`px-2 py-1 rounded border text-xs font-mono font-bold flex gap-1 items-center
                                                    ${isOver ? 'bg-red-950 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                                                        : 'bg-slate-950 border-slate-700 text-slate-300'}`}
                                                >
                                                    <Zap size={10} />
                                                    {qLoad} / {focusLimit}
                                                </div>
                                            }
                                        >
                                            {list.map(init => (
                                                <DraggableInitiativeCard
                                                    key={init.id}
                                                    data={init}
                                                    pillarName={pillarsMap[init.strategic_pillar_id || ''] || 'Unassigned'}
                                                    onMove={() => moveInitiative(init.id, 'paused')}
                                                    variant="active"
                                                    actionIcon={CirclePause}
                                                    actionLabel="Park"
                                                />
                                            ))}
                                            {list.length === 0 && (
                                                <EmptyState
                                                    icon={LayoutDashboard}
                                                    title="Capacity Available"
                                                    message={`Drop initiatives here to schedule in ${q}.`}
                                                />
                                            )}
                                        </Column>
                                    </div>
                                );
                            })}
                        </div>

                        <DragOverlay>
                            {activeDragItem ? (
                                <InitiativeCard
                                    data={activeDragItem}
                                    pillarName={pillarsMap[activeDragItem.strategic_pillar_id || ''] || 'Unassigned'}
                                    variant={['proposed', 'paused'].includes(activeDragItem.status) ? 'proposed' : 'active'}
                                    isOverlay
                                />
                            ) : null}
                        </DragOverlay>

                    </DndContext>
                </div>
            )}
        </div >
    );
};

// --- SUB-COMPONENTS ---

const Gauge = ({ label, value, limit, isOver, format, ghostValue, tooltip, noLimit }: any) => {
    const percent = limit ? Math.min((value / limit) * 100, 100) : 0;
    const colorClass = isOver ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]' : percent > 90 ? 'text-yellow-400' : 'text-slate-100';

    return (
        <div className={`flex flex-col items-center min-w-[100px] ${isOver ? 'animate-pulse' : ''}`}>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1 flex items-center gap-1">
                {label}
                {tooltip && <InfoTooltip content={tooltip} />}
                {ghostValue > 0 && (
                    <span title={`+ ${format ? format(ghostValue) : ghostValue} Future Recurring`} className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]"></span>
                )}
            </span>
            <div className={`font-mono text-xl font-bold leading-none flex items-baseline gap-1 ${colorClass}`}>
                {format ? format(value) : value}
                {!noLimit && limit != null && (
                    <span className="text-slate-600 text-xs font-medium ml-0.5">/ {format ? format(limit) : limit}</span>
                )}
            </div>
            {ghostValue > 0 && (
                <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest mt-1">
                    +{format ? format(ghostValue) : ghostValue} Tail
                </div>
            )}
        </div>
    );
};

const Column = ({ id, title, count, color, children, headerAction, isOverLimit }: any) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full rounded-2xl border overflow-hidden shadow-2xl backdrop-blur-sm transition-colors duration-200
            ${isOverLimit ? 'bg-slate-900/50 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'bg-slate-900/40 border-slate-800'}
            ${isOver ? 'ring-2 ring-blue-500/50 bg-slate-800/60' : ''}
        `}>
            <div className="px-5 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/80">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ring-4 ring-opacity-20 ${color === 'green' ? 'bg-green-500 ring-green-500' : 'bg-blue-500 ring-blue-500'}`}></div>
                    <h2 className="font-bold text-slate-100 tracking-tight text-lg shadow-black drop-shadow-sm">{title}</h2>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold border ${color === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {count}
                    </span>
                </div>
                {headerAction}
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/20 space-y-4">
                {children}
            </div>
        </div>
    );
};

const DraggableInitiativeCard = (props: any) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: props.data.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <InitiativeCard {...props} />
        </div>
    );
};

const InitiativeCard = ({ data, pillarName, onMove, actionIcon: Icon, actionLabel, variant, isOverlay }: any) => {
    const isProposed = variant === 'proposed';

    const hasMandateTension = (
        (data.approval_mandate === 'Cabinet Approved' || data.approval_mandate === 'Ministerial Approved') &&
        (data.relative_priority === 'Tier 2' || data.relative_priority === 'Tier 3')
    );

    const priorityColor = data.relative_priority === 'Tier 1' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        : data.relative_priority === 'Tier 2' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
            : data.relative_priority === 'Tier 3' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                : 'text-slate-400 bg-slate-800 border-slate-700';

    return (
        <div className={`group relative bg-[#182030] border rounded-xl p-5 shadow-lg transition-all duration-200 
            ${hasMandateTension ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-[mandate-pulse_3s_ease-in-out_infinite]' : 'border-slate-700/60 hover:border-slate-500'}
            ${isOverlay ? 'shadow-2xl scale-105 ring-2 ring-blue-500/50' : 'hover:-translate-y-1 hover:shadow-2xl hover:bg-[#1e273b]'}
            `}>
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-colors duration-300 ${isProposed ? 'bg-blue-500' : 'bg-green-500'}`}></div>

            <div className="pl-5 pointer-events-none"> {/* Disable pointer events on children so drag handle works everywhere */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-100 text-base leading-snug pr-4 tracking-tight">{data.title}</h3>
                    <div className="flex gap-2 shrink-0">
                        {hasMandateTension && (
                            <div className="relative group/tension pointer-events-auto">
                                <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                    <AlertTriangle size={12} /> Mandate Tension
                                </div>
                            </div>
                        )}
                        {data.is_multi_year && (
                            <div className="shrink-0 text-purple-400 bg-purple-500/10 p-1.5 rounded-md border border-purple-500/20">
                                <Zap size={14} className="fill-purple-400/20" />
                            </div>
                        )}
                        {data.short_term_win && (
                            <div className="shrink-0 text-green-400 bg-green-500/10 p-1.5 rounded-md border border-green-500/20">
                                <Clock size={14} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-2 mb-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {pillarName}
                    </span>
                    {data.approval_mandate && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {data.approval_mandate}
                        </span>
                    )}
                    {data.relative_priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wider border ${priorityColor}`}>
                            {data.relative_priority}
                        </span>
                    )}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 rounded-md border border-slate-700">
                        <Zap size={12} className={isProposed ? "text-blue-400" : "text-green-400"} />
                        <FocusPill slots={data.focus_slots} />
                    </div>
                </div>

                <div className="flex justify-between items-end border-t border-slate-700/50 pt-4 mt-2 h-[42px]">
                    <div className="flex gap-6 text-xs font-mono text-slate-500">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-600 mb-0.5">Budget</span>
                            <span className="text-slate-300 font-bold text-sm">{formatK((data.capex_current_fy || 0) + (data.opex_current_fy || 0))}</span>
                        </div>
                    </div>

                    {/* Action button (only works when not dragging) */}
                    {onMove && (
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onMove(); }}
                            className={`
                                pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md group-hover:scale-105 active:scale-95 z-10
                                ${isProposed
                                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30'
                                    : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500'}
                            `}
                        >
                            {actionLabel}
                            {Icon && <Icon size={14} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ icon: Icon, title, message, action }: any) => (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 min-h-[160px]">
        <Icon size={32} className="text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-300 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{message}</p>
        {action}
    </div>
);
