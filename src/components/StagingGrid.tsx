import React from 'react';
import { clsx } from 'clsx';
import { Info, TriangleAlert, Wand2 } from 'lucide-react';

export interface StagingInitiative {
    id: string; // temp unique id
    title: string;
    description?: string;
    focus_slots: number | null;
    strategic_pillar_id: string | null;
    capex_required: number;
    opex_required: number;
    novelty_score: number | null;
    dependency_count: number;
    value_drop?: string;
    funding_status: 'funded' | 'partially_funded' | 'not_funded' | 'pending';
    sponsor?: string;
    isAiSuggested?: boolean;
}

const AiHighlight: React.FC<{ active?: boolean, children: React.ReactNode }> = ({ active, children }) => (
    <div className={clsx("relative h-full w-full", active && "ring-2 ring-yellow-500/50 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]")}>
        {active && (
            <div className="absolute top-0 right-0 p-0.5 text-yellow-500 z-10 pointer-events-none">
                <Wand2 size={10} />
            </div>
        )}
        {children}
    </div>
);

interface StagingGridProps {
    data: StagingInitiative[];
    pillars: { id: string; title: string }[];
    onDataChange: (data: StagingInitiative[]) => void;
}

const InputCell = ({
    value,
    onChange,
    type = 'text',
    max,
    min,
    required = false,
    className,
    placeholder
}: {
    value: any,
    onChange: (val: any) => void,
    type?: string,
    max?: number,
    min?: number,
    required?: boolean,
    className?: string,
    placeholder?: string
}) => {
    const isError = required && (value === null || value === '' || (type === 'number' && isNaN(value)));

    return (
        <div className={clsx("relative h-full w-full", isError ? "ring-2 ring-red-500 ring-inset bg-red-900/20" : "")}>
            <input
                type={type}
                value={value ?? ''}
                onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
                className={clsx(
                    "w-full h-full bg-transparent border-none px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none",
                    className
                )}
                max={max}
                min={min}
                placeholder={placeholder}
            />
            {isError && (
                <div className="absolute top-0 right-0 p-1 text-red-500" title="Required field">
                    <TriangleAlert size={12} />
                </div>
            )}
        </div>
    );
};

const SelectCell = ({
    value,
    options,
    onChange,
    required = false
}: {
    value: string | null,
    options: { value: string, label: string }[],
    onChange: (val: string) => void,
    required?: boolean
}) => {
    const isError = required && !value;

    return (
        <div className={clsx("relative h-full w-full", isError ? "ring-2 ring-red-500 ring-inset bg-red-900/20" : "")}>
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-full bg-transparent border-none px-2 py-1 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            >
                <option value="" className="bg-navy-900 text-slate-500">Select...</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-navy-900 text-slate-200">
                        {opt.label}
                    </option>
                ))}
            </select>
            {isError && (
                <div className="absolute top-1 right-1 pointer-events-none text-red-500">
                    <TriangleAlert size={12} />
                </div>
            )}
        </div>
    );
};

export const StagingGrid: React.FC<StagingGridProps> = ({ data, pillars = [], onDataChange }) => {

    const updateRow = (index: number, field: keyof StagingInitiative, value: any) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: value };
        onDataChange(newData);
    };

    const deleteRow = (index: number) => {
        const newData = data.filter((_, i) => i !== index);
        onDataChange(newData);
    };

    return (
        <div className="overflow-x-auto border border-navy-700 rounded-lg shadow-xl bg-navy-800">
            <table className="w-full text-left border-collapse">
                <thead className="bg-navy-900 text-slate-400 text-xs uppercase font-semibold tracking-wider sticky top-0 z-10">
                    <tr>
                        <th className="p-3 border-b border-navy-700 w-12">#</th>
                        <th className="p-3 border-b border-navy-700 min-w-[200px]">Title <span className="text-red-400">*</span></th>
                        <th className="p-3 border-b border-navy-700 w-32">
                            <div className="flex items-center gap-1" title="Strategic Alignment">
                                Pillar <span className="text-red-400">*</span>
                                <Info size={12} className="text-slate-500 cursor-help" />
                            </div>
                        </th>
                        <th className="p-3 border-b border-navy-700 w-24">
                            <div className="flex items-center gap-1" title="Organizational energy: Small (1), Medium (3), Large (5)">
                                Focus <span className="text-red-400">*</span>
                                <Info size={12} className="text-slate-500 cursor-help" />
                            </div>
                        </th>
                        <th className="p-3 border-b border-navy-700 w-24">
                            <div className="flex items-center gap-1" title="1 = Standard BAU; 5 = First of its kind">
                                Novelty
                                <Info size={12} className="text-slate-500 cursor-help" />
                            </div>
                        </th>
                        <th className="p-3 border-b border-navy-700 w-28 text-right">CAPEX</th>
                        <th className="p-3 border-b border-navy-700 w-28 text-right">OPEX</th>
                        <th className="p-3 border-b border-navy-700 min-w-[150px]">
                            <div className="flex items-center gap-1" title="Must be [Verb] + [Object] + [Metric] within the configured horizon">
                                Value Drop
                                <Info size={12} className="text-slate-500 cursor-help" />
                            </div>
                        </th>
                        <th className="p-3 border-b border-navy-700 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-navy-700">
                    {data.map((row, index) => (
                        <tr key={row.id} className="group hover:bg-navy-700/50 transition-colors">
                            <td className="p-0 text-center text-slate-500 text-xs font-mono border-r border-navy-700/50 bg-navy-900/30">
                                {index + 1}
                            </td>

                            {/* Title */}
                            <td className="p-0 border-r border-navy-700/50">
                                <InputCell
                                    value={row.title}
                                    onChange={(v) => updateRow(index, 'title', v)}
                                    required
                                    className="font-medium text-white"
                                />
                            </td>

                            {/* Strategic Pillar */}
                            <td className="p-0 border-r border-navy-700/50">
                                <SelectCell
                                    value={row.strategic_pillar_id}
                                    onChange={(v) => updateRow(index, 'strategic_pillar_id', v)}
                                    options={pillars.map(p => ({ value: p.id, label: p.title }))}
                                    required
                                />
                            </td>

                            {/* Focus Slots */}
                            <td className="p-0 border-r border-navy-700/50 bg-navy-900/10">
                                <AiHighlight active={row.isAiSuggested}>
                                    <InputCell
                                        type="number"
                                        value={row.focus_slots}
                                        onChange={(v) => updateRow(index, 'focus_slots', v)}
                                        min={1}
                                        max={10}
                                        required
                                        className="text-center font-mono"
                                    />
                                </AiHighlight>
                            </td>

                            {/* Novelty Score */}
                            <td className="p-0 border-r border-navy-700/50">
                                <AiHighlight active={row.isAiSuggested}>
                                    <InputCell
                                        type="number"
                                        value={row.novelty_score}
                                        onChange={(v) => updateRow(index, 'novelty_score', v)}
                                        min={1}
                                        max={5}
                                        className="text-center font-mono"
                                    />
                                </AiHighlight>
                            </td>

                            {/* CAPEX */}
                            <td className="p-0 border-r border-navy-700/50">
                                <InputCell
                                    type="number"
                                    value={row.capex_required}
                                    onChange={(v) => updateRow(index, 'capex_required', v)}
                                    min={0}
                                    className="text-right font-mono text-slate-300"
                                />
                            </td>

                            {/* OPEX */}
                            <td className="p-0 border-r border-navy-700/50">
                                <InputCell
                                    type="number"
                                    value={row.opex_required}
                                    onChange={(v) => updateRow(index, 'opex_required', v)}
                                    min={0}
                                    className="text-right font-mono text-slate-300"
                                />
                            </td>

                            {/* Value Drop */}
                            <td className="p-0 border-r border-navy-700/50">
                                <InputCell
                                    value={row.value_drop}
                                    onChange={(v) => updateRow(index, 'value_drop', v)}
                                    placeholder="e.g. Increase sales by 10%"
                                    className="text-xs"
                                />
                            </td>

                            <td className="p-2 text-center">
                                <button
                                    onClick={() => deleteRow(index)}
                                    className="text-slate-600 hover:text-red-400 transition-colors"
                                    title="Remove row"
                                >
                                    &times;
                                </button>
                            </td>
                        </tr>
                    ))}
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-500 italic">
                                No data loaded. Upload a CSV to begin.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
