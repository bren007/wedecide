import { useMemo, useState, useEffect } from 'react';
import { useSandboxState, Initiative } from '../hooks/useSandboxState';
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
import { EditInitiativeModal } from '../components/EditInitiativeModal';
import { Settings, X } from 'lucide-react';

const MandateTensionModal = ({ isOpen, item, from, to, onConfirm, onCancel }: unknown) => {
    const [rationale, setRationale] = useState('');

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (isOpen) setRationale('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-orange-500/50 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-6 py-4 border-b border-orange-900/50 bg-orange-950/30">
                    <h3 className="text-lg font-bold text-orange-400">Mandate Tension Rationale Required</h3>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-300 mb-4 font-medium">
                        You have re-sequenced <strong className="text-white">{item?.title}</strong> from [{from}] to [{to}]. This initiative carries a [{item?.approval_mandate}] mandate. This decision will be recorded in the Strategic Ledger and requires a documented rationale.
                    </p>
                    <textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        placeholder="e.g., Delaying due to emergent dependency conflict..."
                        className="w-full h-32 px-4 py-3 bg-slate-950 border border-orange-900/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(rationale)}
                        disabled={!rationale.trim() || rationale.length < 5}
                        className="bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    >
                        Confirm Re-sequence
                    </Button>
                </div>
            </div>
        </div>
    );
};

// --- VISUAL HELPERS ---

const formatK = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
};



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
        updateInitiativeDetails,
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
    const [activeDragItem, setActiveDragItem] = useState< unknown >(null);
    const [editingInitiative, setEditingInitiative] = useState< unknown >(null);
    const [prePopulatedRationale, setPrePopulatedRationale] = useState('');
    const [tensionModal, setTensionModal] = useState<{ isOpen: boolean; item: unknown; from: string; to: string; wasStatusChange: boolean } | null>(null);

    const handleCommit = () => {
        if (!hasChanges) return;
        setIsCommitOpen(true);
    };

    const executeCommit = async (rationale: string) => {
        await commitChanges(rationale);
        setIsCommitOpen(false);
        setPrePopulatedRationale(''); // Clear pre-populated rationale
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
        const grouped: Record<string, Initiative[]> = {};
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

        const fromContainer = ['proposed', 'paused'].includes(item.status) ? 'backlog' : (item.target_delivery_quarter || 'Q1 FY26');
        if (fromContainer === targetContainer) return;

        let wasStatusChange = false;

        const hasMandateTension = (
            (item.approval_mandate === 'Cabinet Approved' || item.approval_mandate === 'Ministerial Approved') &&
            (item.relative_priority === 'Tier 2' || item.relative_priority === 'Tier 3')
        );

        if (targetContainer === 'backlog') {
            if (['active', 'approved'].includes(item.status)) {
                moveInitiative(sourceId, 'paused');
                wasStatusChange = true;
            }
        } else if (quarters.includes(targetContainer)) {
            if (['proposed', 'paused'].includes(item.status)) {
                moveInitiative(sourceId, 'active');
                wasStatusChange = true;
            }
            // Always update quarter if dropped in a quarter lane
            updateInitiativeQuarter(sourceId, targetContainer);
        }

        if (hasMandateTension) {
            setTimeout(() => {
                setTensionModal({
                    isOpen: true,
                    item,
                    from: fromContainer,
                    to: targetContainer,
                    wasStatusChange
                });
            }, 50); // Small delay to let drop animation finish
        } else {
            setPrePopulatedRationale(prev => prev + `Re-sequenced [${item.title}] from [${fromContainer}] to [${targetContainer}].\n`);
        }
    };

    const handleTensionConfirm = (rationale: string) => {
        if (!tensionModal) return;
        setPrePopulatedRationale(prev => prev + `Re-sequenced [${tensionModal.item.title}] from [${tensionModal.from}] to [${tensionModal.to}]: ${rationale}\n`);
        setTensionModal(null);
    };

    const handleTensionCancel = () => {
        if (!tensionModal) return;
        if (tensionModal.wasStatusChange) {
            moveInitiative(tensionModal.item.id, tensionModal.item.status); // revert status
        }
        updateInitiativeQuarter(tensionModal.item.id, tensionModal.item.target_delivery_quarter); // revert quarter
        setTensionModal(null);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300 ">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-lg font-medium animate-pulse">Initializing Command Center...</div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-red-400 ">
            <div className="p-8 bg-slate-900 rounded-xl border border-red-900/50 shadow-2xl flex flex-col items-center gap-4">
                <TriangleAlert size={48} />
                <div className="text-xl font-bold">System Error</div>
                <p className="text-slate-400">{error}</p>
                <Button onClick={() => window.location.reload()} variant="secondary">Reload System</Button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-950 pt-16 lg:pt-0">

            {/* --- TOP HEADER --- */}
            <header className="shrink-0 bg-[#131924]/85 border-b border-[#222c3f] px-8 py-5 flex flex-col xl:flex-row justify-between items-center gap-6 z-10 backdrop-blur-md">

                {/* METRICS GAUGES */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <Gauge
                        label="Peak Focus Load"
                        value={currentFocusLoad}
                        limit={focusLimit}
                        isOver={isOverFocus}
                        tooltip="Focus Slots: A calculated measure of the senior leadership attention required to govern an initiative through to delivery. Derived from stakeholder breadth, novelty, and dependency depth."
                        limitTooltip="Capacity Baseline: The maximum Focus Slots your organisation can sustain simultaneously before structural delivery failure becomes inevitable."
                    />
                    <div className="w-px h-8 bg-slate-800/40 hidden md:block"></div>
                    <Gauge
                        label="Fiscal Drag"
                        value={fiscalDrag}
                        limit={fiscalDragThreshold || 0}
                        isOver={isOverFiscalDrag}
                        format={formatK}
                        noLimit={fiscalDragThreshold == null}
                        tooltip="Current-year budget committed to Tier 2 and Tier 3 initiatives — the budget unavailable to your Tier 1 priorities."
                    />
                    <div className="w-px h-8 bg-slate-800/40 hidden md:block"></div>
                    <Gauge
                        label="Active Capex"
                        value={currentCapexLoad}
                        limit={capexLimit}
                        isOver={isOverCapex}
                        format={formatK}
                    />
                    <div className="w-px h-8 bg-slate-800/40 hidden md:block"></div>
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
                <div className="flex items-center gap-6 border-t xl:border-t-0 xl:border-l border-slate-800/40 pt-4 xl:pt-0 xl:pl-6 w-full xl:w-auto justify-between xl:justify-start">
                    <MeetingControls
                        meeting={currentMeeting}
                        loading={meetingLoading}
                        onStart={() => startMeeting()}
                        onEnd={() => endMeeting()}
                    />
                    <Button
                        variant={hasChanges ? (currentMeeting ? 'primary' : 'danger') : 'secondary'}
                        onClick={handleCommit}
                        disabled={!hasChanges || saving}
                        className={hasChanges ? (currentMeeting ? 'bg-blue-600 hover:bg-blue-500 shadow-md font-bold' : 'bg-rose-600 hover:bg-rose-500 shadow-md text-white font-bold') : ''}
                    >
                        {saving ? (
                            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                        ) : (
                            <Save size={16} className="mr-2" />
                        )}
                        {saving ? 'Committing...' : hasChanges ? 'Commit Changes' : 'No Changes'}
                    </Button>
                </div>
                {showSuccess && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-right-4 duration-300 px-2">
                        <Check size={16} /> Saved!
                    </div>
                )}
            </header>

            {/* SANDBOX BANNER */}
            {hasChanges && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200/90 text-xs font-bold uppercase tracking-widest text-center py-2 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300 flex flex-wrap items-center justify-center gap-4">
                    <span className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-400" />
                        Sandbox Mode — Changes not yet committed
                    </span>
                    <Button
                        size="sm"
                        variant={currentMeeting ? 'primary' : 'danger'}
                        onClick={handleCommit}
                        disabled={saving}
                        className={currentMeeting ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.4)] px-3 py-1 h-auto text-[10px]' : 'bg-red-600 hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.4)] text-white font-bold px-3 py-1 h-auto text-[10px]'}
                    >
                        {saving ? 'Committing...' : 'Commit Now'}
                    </Button>
                </div>
            )}

            <CommitModal
                isOpen={isCommitOpen}
                onClose={() => setIsCommitOpen(false)}
                onCommit={executeCommit}
                saving={saving}
                isSevere={!currentMeeting}
                initialRationale={prePopulatedRationale}
            />

            <MandateTensionModal
                isOpen={tensionModal?.isOpen || false}
                item={tensionModal?.item}
                from={tensionModal?.from}
                to={tensionModal?.to}
                onConfirm={handleTensionConfirm}
                onCancel={handleTensionCancel}
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
                                            <a href="/strategic-ingestion" className="text-xs font-bold text-indigo-300 hover:text-white px-3 py-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 hover:border-indigo-500/40 shadow-sm flex items-center gap-1.5" title="Import from CSV">
                                                <ListFilter size={14} /> Import
                                            </a>
                                            <a href="/propose-initiative" className="text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/10 px-3 py-1.5 rounded hover:bg-emerald-500/20 transition-all border border-emerald-500/20 hover:border-emerald-500/40 flex items-center shadow-sm" title="Create New Initiative">
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
                                            onEdit={() => setEditingInitiative(init)}
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
                                                    title={isOver ? "This delivery quarter is over capacity. Initiatives in this quarter are competing for the same governance bandwidth." : undefined}
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
                                                    onEdit={() => setEditingInitiative(init)}
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

            <EditInitiativeModal
                isOpen={!!editingInitiative}
                onClose={() => setEditingInitiative(null)}
                initiative={editingInitiative}
                pillarsMap={pillarsMap}
                onSave={updateInitiativeDetails}
            />

        </div >
    );
};

// --- SUB-COMPONENTS ---

const Gauge = ({ label, value, limit, isOver, format, ghostValue, tooltip, limitTooltip, noLimit }: unknown) => {
    const percent = limit ? Math.min((value / limit) * 100, 100) : 0;
    const colorClass = isOver ? 'text-rose-400' : percent > 90 ? 'text-amber-400' : 'text-slate-200';

    return (
        <div className="flex flex-col items-start min-w-[120px] transition-all duration-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                {label}
                {tooltip && <InfoTooltip content={tooltip} />}
                {ghostValue > 0 && (
                    <span title={`+ ${format ? format(ghostValue) : ghostValue} Future Recurring`} className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm animate-pulse"></span>
                )}
            </span>
            <div className={`font-mono text-lg font-bold leading-none flex items-baseline gap-1.5 ${colorClass}`}>
                <span>{format ? format(value) : value}</span>
                {!noLimit && limit != null && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-xs font-medium">/ {format ? format(limit) : limit}</span>
                        {limitTooltip && <InfoTooltip content={limitTooltip} />}
                    </div>
                )}
            </div>
            {ghostValue > 0 && (
                <div className="text-[9px] font-mono text-purple-400 tracking-wide mt-1 opacity-90">
                    +{format ? format(ghostValue) : ghostValue} Tail
                </div>
            )}
        </div>
    );
};

const Column = ({ id, title, count, color, children, headerAction, isOverLimit }: unknown) => {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full rounded-xl border overflow-hidden shadow-sm backdrop-blur-sm transition-all duration-200
            ${isOverLimit ? 'bg-[#221217]/50 border-rose-500/25 shadow-sm' : 'bg-[#131924]/40 border-[#222c3f]'}
            ${isOver ? 'ring-1 ring-blue-500/30 bg-slate-800/40' : ''}
        `}>
            <div className="px-5 py-4 border-b border-[#222c3f] flex justify-between items-center bg-[#131924]/60">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${color === 'green' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    <h2 className="font-semibold text-slate-200 tracking-tight text-base">{title}</h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${color === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                        {count}
                    </span>
                </div>
                {headerAction}
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/10 space-y-3.5">
                {children}
            </div>
        </div>
    );
};

const DraggableInitiativeCard = (props: unknown) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: props.data.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.35 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <InitiativeCard {...props} />
        </div>
    );
};

const InitiativeCard = ({ data, pillarName, onMove, onEdit, actionIcon: Icon, actionLabel, variant, isOverlay }: unknown) => {
    const isProposed = variant === 'proposed';

    const hasMandateTension = (
        (data.approval_mandate === 'Cabinet Approved' || data.approval_mandate === 'Ministerial Approved') &&
        (data.relative_priority === 'Tier 2' || data.relative_priority === 'Tier 3')
    );

    const priorityColor = data.relative_priority === 'Tier 1' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/30'
        : data.relative_priority === 'Tier 2' ? 'text-amber-400 bg-amber-950/30 border-amber-900/30'
            : data.relative_priority === 'Tier 3' ? 'text-rose-400 bg-rose-950/30 border-rose-900/30'
                : 'text-slate-400 bg-[#131924] border-[#222c3f]';

    return (
        <div className={`group relative bg-[#131924] border rounded-xl p-4.5 shadow-sm transition-all duration-200 
            ${hasMandateTension ? 'border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.06)]' : 'border-[#222c3f] hover:border-slate-700/60'}
            ${isOverlay ? 'shadow-lg scale-102 ring-1 ring-blue-500/30 bg-[#1b2332]' : 'hover:shadow-md hover:bg-[#182030]'}
            `}>
            {/* Color Accent Indicator Strip */}
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md transition-colors duration-300 ${isProposed ? 'bg-blue-500/70' : 'bg-emerald-500/70'}`}></div>

            <div className="pl-3.5 pointer-events-none"> {/* Disable pointer events on children so drag handle works everywhere */}
                <div className="flex justify-between items-start mb-2.5">
                    <h3 className="font-semibold text-slate-200 text-sm leading-snug pr-4 tracking-tight">{data.title}</h3>
                    <div className="flex gap-1.5 shrink-0">
                        {hasMandateTension && (
                            <div className="relative group/tension pointer-events-auto flex items-center">
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950/40 text-rose-400 border border-rose-900/40">
                                    <AlertTriangle size={10} /> Misaligned
                                </div>
                                <div className="ml-1">
                                    <InfoTooltip content={`This initiative carries a ${data.approval_mandate} mandate but is currently classified as ${data.relative_priority} priority. This misalignment carries governance and reporting risk.`} />
                                </div>
                            </div>
                        )}
                        {data.is_multi_year && (
                            <div className="shrink-0 text-purple-400 bg-purple-950/30 p-1 rounded border border-purple-900/30" title="Multi-Year Plan">
                                <Zap size={11} className="fill-purple-400/20" />
                            </div>
                        )}
                        {data.short_term_win && (
                            <div className="shrink-0 text-emerald-400 bg-emerald-950/30 p-1 rounded border border-emerald-900/30" title="Short Term Win">
                                <Clock size={11} />
                            </div>
                        )}
                        {onEdit && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                                className="shrink-0 text-slate-500 hover:text-white bg-slate-800/40 hover:bg-slate-700/60 p-1 rounded border border-transparent hover:border-[#313f57] transition-all cursor-pointer pointer-events-auto opacity-0 group-hover:opacity-100 shadow-sm" 
                                title="Edit Initiative Stats"
                            >
                                <Settings size={11} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Badges and slots */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-slate-900 text-slate-400 border border-[#222c3f]">
                        {pillarName}
                    </span>
                    {data.approval_mandate && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wide bg-blue-950/30 text-blue-300 border border-blue-900/30">
                            {data.approval_mandate}
                        </span>
                    )}
                    {data.relative_priority && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide border ${priorityColor}`}>
                            {data.relative_priority}
                        </span>
                    )}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 rounded text-[9px] font-semibold text-slate-400 border border-[#222c3f]">
                        <Zap size={10} className={`${isProposed ? "text-blue-400/80" : "text-emerald-400/80"}`} />
                        <span>{data.focus_slots} focus slots</span>
                    </div>
                </div>

                <div className="flex justify-between items-end border-t border-[#222c3f]/50 pt-3 mt-1.5 h-[36px]">
                    <div className="flex gap-4 text-xs font-mono text-slate-500">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-semibold text-slate-500 mb-0.5">Budget</span>
                            <span className="text-slate-300 font-bold text-xs">{formatK((data.capex_current_fy || 0) + (data.opex_current_fy || 0))}</span>
                        </div>
                    </div>

                    {/* Action button (only works when not dragging) */}
                    {onMove && (
                        <button
                            onPointerDown={e => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); onMove(); }}
                            className={`
                                pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all shadow-sm active:scale-97 z-10
                                ${isProposed
                                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                                    : 'bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/10 hover:border-rose-600'}
                            `}
                        >
                            {actionLabel}
                            {Icon && <Icon size={11} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ icon: Icon, title, message, action }: unknown) => (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 min-h-[160px]">
        <Icon size={32} className="text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-300 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{message}</p>
        {action}
    </div>
);
