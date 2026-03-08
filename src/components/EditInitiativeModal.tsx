import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './Button';
import type { Initiative } from '../hooks/useSandboxState';

interface EditInitiativeModalProps {
    isOpen: boolean;
    onClose: () => void;
    initiative: Initiative | null;
    pillarsMap?: Record<string, string>;
    onSave: (id: string, updates: Partial<Initiative>) => Promise<void>;
}

export const EditInitiativeModal: React.FC<EditInitiativeModalProps> = ({ isOpen, onClose, initiative, pillarsMap = {}, onSave }) => {
    const [saving, setSaving] = useState(false);

    // Form fields
    // Form fields
    const [title, setTitle] = useState<string>('');
    const [pillarId, setPillarId] = useState<string>('');
    const [stakeholder, setStakeholder] = useState<number>(0);
    const [tech, setTech] = useState<number>(0);
    const [dependency, setDependency] = useState<number>(0);
    const [capex, setCapex] = useState<number>(0);
    const [opex, setOpex] = useState<number>(0);
    const [futureOpex, setFutureOpex] = useState<number>(0);
    const [totalCost, setTotalCost] = useState<number>(0);
    const [isMultiYear, setIsMultiYear] = useState<boolean>(false);
    const [quarter, setQuarter] = useState<string>('');

    useEffect(() => {
        if (initiative && isOpen) {
            setTitle(initiative.title || '');
            setPillarId(initiative.strategic_pillar_id || '');
            setStakeholder(initiative.complexity_stakeholder || 0);
            setTech(initiative.complexity_tech || 0);
            setDependency(initiative.complexity_dependency || 0);
            setCapex(initiative.capex_current_fy || 0);
            setOpex(initiative.opex_current_fy || 0);
            setFutureOpex(initiative.future_annual_opex || 0);
            setTotalCost(initiative.total_initiative_cost || 0);
            setIsMultiYear(initiative.is_multi_year || false);
            setQuarter(initiative.target_delivery_quarter || '');
        }
    }, [initiative, isOpen]);

    if (!isOpen || !initiative) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(initiative.id, {
                title: title,
                strategic_pillar_id: pillarId || null as any,
                complexity_stakeholder: Number(stakeholder),
                complexity_tech: Number(tech),
                complexity_dependency: Number(dependency),
                capex_current_fy: Number(capex),
                opex_current_fy: Number(opex),
                future_annual_opex: Number(futureOpex),
                total_initiative_cost: Number(totalCost),
                is_multi_year: isMultiYear,
                target_delivery_quarter: quarter || null as any
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/80">
                    <h2 className="text-lg font-bold text-slate-100 pr-4">Edit Initiative Details</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Initiative Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Enter title"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Strategic Pillar
                        </label>
                        <select
                            value={pillarId}
                            onChange={(e) => setPillarId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">Select Pillar</option>
                            {Object.entries(pillarsMap).map(([id, titleName]) => (
                                <option key={id} value={id}>{titleName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1" title="Stakeholder & Change Management">
                                Stakeholder
                            </label>
                            <input
                                type="number"
                                min="1" max="5"
                                value={stakeholder}
                                onChange={(e) => setStakeholder(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1" title="Technical Novelty / Integration">
                                Tech
                            </label>
                            <input
                                type="number"
                                min="1" max="5"
                                value={tech}
                                onChange={(e) => setTech(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1" title="Dependency / Links">
                                Dependency
                            </label>
                            <input
                                type="number"
                                min="1" max="5"
                                value={dependency}
                                onChange={(e) => setDependency(Number(e.target.value))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Current FY CAPEX
                        </label>
                        <input
                            type="number"
                            value={capex}
                            onChange={(e) => setCapex(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Current FY OPEX
                        </label>
                        <input
                            type="number"
                            value={opex}
                            onChange={(e) => setOpex(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Future Annual OPEX
                        </label>
                        <input
                            type="number"
                            value={futureOpex}
                            onChange={(e) => setFutureOpex(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Total Initiative Cost
                        </label>
                        <input
                            type="number"
                            value={totalCost}
                            onChange={(e) => setTotalCost(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <input
                                type="checkbox"
                                checked={isMultiYear}
                                onChange={(e) => setIsMultiYear(e.target.checked)}
                                className="w-4 h-4 bg-slate-950 border border-slate-700 rounded text-blue-500 focus:ring-blue-500"
                            />
                            Multi-Year Initiative?
                        </label>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Target Delivery Quarter
                        </label>
                        <select
                            value={quarter}
                            onChange={(e) => setQuarter(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">Select Quarter</option>
                            <option value="Q1 FY26">Q1 FY26</option>
                            <option value="Q2 FY26">Q2 FY26</option>
                            <option value="Q3 FY26">Q3 FY26</option>
                            <option value="Q4 FY26">Q4 FY26</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={saving}
                        className="bg-blue-600 hover:bg-blue-500"
                    >
                        <Save size={16} className="mr-2" /> Save Details
                    </Button>
                </div>
            </div>
        </div>
    );
};
