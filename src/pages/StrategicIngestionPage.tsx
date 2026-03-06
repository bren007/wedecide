import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { StagingGrid, type StagingInitiative } from '../components/StagingGrid';
import { Upload, FileUp, CheckCircle, AlertTriangle, Wand2 } from 'lucide-react';
import { useAIMapping } from '../hooks/useAIMapping';

export const StrategicIngestionPage: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [stagingData, setStagingData] = useState<StagingInitiative[]>([]);
    const [pillars, setPillars] = useState<{ id: string; title: string }[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // AI Magic
    const { mapHeaders, inferSlotsAndNovelty, isProcessing: isAiProcessing } = useAIMapping();

    // Bulk Edit State
    const [bulkPillar, setBulkPillar] = useState('');
    const [bulkFocus, setBulkFocus] = useState<number | ''>('');

    useEffect(() => {
        const fetchPillars = async () => {
            const { data } = await supabase.from('strategic_pillars' as any).select('id, title');
            if (data) setPillars(data as any);
        };
        fetchPillars();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const resultsData = results.data as any[];
                if (resultsData.length === 0) return;

                const csvHeaders = Object.keys(resultsData[0]);
                let fieldMap: Record<string, string> | null = null;

                setLogs(prev => [...prev, `Parsing ${resultsData.length} rows...`]);

                // Try AI Mapping
                try {
                    fieldMap = await mapHeaders(csvHeaders, resultsData.slice(0, 3));
                    if (fieldMap) {
                        setLogs(prev => [...prev, `🤖 AI Auto-Mapped Headers: ${JSON.stringify(fieldMap)}`]);
                    }
                } catch (e) {
                    console.warn("AI Mapping failed, using heuristic", e);
                }

                const parsed: StagingInitiative[] = resultsData.map((row: any, index: number) => {
                    // Helper to get value via Map or Heuristic
                    const getValue = (targetField: string, heuristicKeys: string[]) => {
                        // 1. Try AI Map
                        if (fieldMap) {
                            // Find CSV header that maps to targetField
                            const mappedHeader = Object.keys(fieldMap).find(key => fieldMap![key] === targetField);
                            if (mappedHeader && row[mappedHeader] !== undefined) return row[mappedHeader];
                        }
                        // 2. Heuristic
                        for (const key of heuristicKeys) {
                            // Case insensitive check
                            const rowKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
                            if (rowKey && row[rowKey] !== undefined) return row[rowKey];
                        }
                        return undefined;
                    };

                    const focusVal = getValue('focus_slots', ['focus', 'focus slots', 'complexity']);
                    const titleVal = getValue('title', ['title', 'initiative', 'name', 'project']);
                    const capexVal = getValue('capex_current_fy', ['capex', 'cost', 'investment', 'capex_required', 'capex_current_fy']);
                    const opexVal = getValue('opex_current_fy', ['opex', 'operational cost', 'opex_required', 'opex_current_fy']);
                    const totalCostVal = getValue('total_initiative_cost', ['total cost', 'total_initiative_cost']);
                    const isMultiYearVal = getValue('is_multi_year', ['is_multi_year', 'multi year', 'multi-year']);
                    const futureOpexVal = getValue('future_annual_opex', ['future_annual_opex', 'future opex', 'tail']);
                    const stakeholderVal = getValue('complexity_stakeholder', ['stakeholder', 'stakeholder friction', 'internal', 'complexity_stakeholders_1_to_3']);
                    const techVal = getValue('complexity_tech', ['tech', 'novelty', 'integration', 'innovation', 'complexity_novelty_1_to_3']);
                    const dependencyVal = getValue('complexity_dependency', ['dependency', 'dependency depth', 'links', 'downstream', 'complexity_dependency_1_to_3']);
                    const mandateVal = getValue('approval_mandate', ['approval_mandate', 'mandate', 'approval', 'approval mandate']);
                    const priorityVal = getValue('relative_priority', ['relative_priority', 'priority', 'priority tier', 'relative priority']);
                    const quarterVal = getValue('target_delivery_quarter', ['target_delivery_quarter', 'delivery quarter', 'quarter', 'target quarter']);
                    const budgetVal = getValue('current_fy_budget', ['current_fy_budget', 'budget', 'fy budget', 'annual budget']);

                    return {
                        id: `row-${index}-${Date.now()}`,
                        title: titleVal || 'Untitled',
                        description: getValue('description', ['description', 'desc', 'summary']) || '',
                        focus_slots: parseInt(focusVal || '0') || null,
                        strategic_pillar_id: null,
                        capex_current_fy: parseFloat(capexVal || '0') || 0,
                        opex_current_fy: parseFloat(opexVal || '0') || 0,
                        total_initiative_cost: parseFloat(totalCostVal || '0') || 0,
                        is_multi_year: isMultiYearVal === 'true' || isMultiYearVal === 'Yes' || isMultiYearVal === '1' || isMultiYearVal === true,
                        future_annual_opex: parseFloat(futureOpexVal || '0') || 0,
                        complexity_stakeholder: parseInt(stakeholderVal || '0') || null,
                        complexity_tech: parseInt(techVal || '0') || null,
                        complexity_dependency: parseInt(dependencyVal || '0') || null,
                        dependency_count: parseInt(getValue('dependency_count', ['dependencies', 'deps', 'dependency_blockers']) || '0') || 0,
                        value_drop: getValue('value_drop', ['value drop', 'value']) || '',
                        funding_status: 'pending' as const,
                        approval_mandate: mandateVal || null,
                        relative_priority: priorityVal || null,
                        target_delivery_quarter: quarterVal || null,
                        current_fy_budget: parseFloat(budgetVal || '0') || 0,
                    };
                });
                setStagingData(parsed);
                setLogs(prev => [...prev, `Parsed and mapped ${parsed.length} rows.`]);
            },
            error: (error) => {
                setLogs(prev => [...prev, `❌ CSV Error: ${error.message}`]);
            }
        });
    };

    const handleBulkApplyPillar = () => {
        if (!bulkPillar) return;
        setStagingData(prev => prev.map(item => ({ ...item, strategic_pillar_id: bulkPillar })));
        setLogs(prev => [...prev, `Updated all rows to pillar ID: ${bulkPillar}`]);
    };

    const handleBulkApplyFocus = () => {
        if (!bulkFocus) return;
        setStagingData(prev => prev.map(item => ({
            ...item,
            complexity_stakeholder: 3,
            complexity_tech: 3,
            complexity_dependency: 3
        })));
        setLogs(prev => [...prev, `Updated all rows to median complexity (Focus will compute to 3)`]);
    };

    const isValid = useMemo(() => {
        if (stagingData.length === 0) return false;
        return stagingData.every(row =>
            row.title &&
            row.complexity_stakeholder && row.complexity_tech && row.complexity_dependency &&
            row.strategic_pillar_id &&
            row.approval_mandate &&
            row.relative_priority &&
            row.target_delivery_quarter
        );
    }, [stagingData]);

    const handleImport = async () => {
        if (!isValid) return;
        setUploading(true);
        setLogs(prev => [...prev, 'Starting Import...']);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get user's org
            const { data: userData } = await supabase
                .from('users' as any)
                .select('organization_id')
                .eq('id', user.id)
                .single();
            const orgId = (userData as any)?.organization_id;

            let imported = 0;
            let errors = 0;


            for (const item of stagingData) {
                const score = (item.complexity_stakeholder || 0) + (item.complexity_tech || 0) + (item.complexity_dependency || 0);
                const computedSlots = score <= 5 ? 1 : score <= 10 ? 3 : 5;

                const { error } = await supabase.from('initiatives' as any).insert({
                    org_id: orgId,
                    owner_id: user.id,
                    title: item.title,
                    focus_slots: computedSlots,
                    complexity_stakeholder: item.complexity_stakeholder,
                    complexity_tech: item.complexity_tech,
                    complexity_dependency: item.complexity_dependency,
                    strategic_pillar_id: item.strategic_pillar_id,
                    capex_current_fy: item.capex_current_fy,
                    opex_current_fy: item.opex_current_fy,
                    total_initiative_cost: item.total_initiative_cost,
                    is_multi_year: item.is_multi_year,
                    future_annual_opex: item.future_annual_opex,
                    dependency_count: item.dependency_count,
                    value_drop: item.value_drop,
                    funding_status: item.funding_status,
                    approval_mandate: item.approval_mandate,
                    relative_priority: item.relative_priority,
                    target_delivery_quarter: item.target_delivery_quarter,
                    current_fy_budget: item.current_fy_budget || 0,
                    status: 'proposed'
                });

                if (error) {
                    console.error('Import error', error);
                    errors++;
                } else {
                    imported++;
                }
            }

            setLogs(prev => [...prev, `✅ Import Complete: ${imported} Success, ${errors} Failed`]);
            if (errors === 0) {
                setTimeout(() => navigate('/command-center'), 1500);
            }

        } catch (err: any) {
            setLogs(prev => [...prev, `❌ Error: ${err.message}`]);
        } finally {
            setUploading(false);
        }
    };

    const runAiInference = async () => {
        if (stagingData.length === 0) return;
        setLogs(prev => [...prev, '🤖 AI Inference: Analyzing "Legacy Mess"...']);
        try {
            const enhanced = await inferSlotsAndNovelty(stagingData, pillars);
            setStagingData(enhanced);
            setLogs(prev => [...prev, `✅ AI Analysis Complete. Suggestions highlighted in Gold.`]);
        } catch (e: any) {
            setLogs(prev => [...prev, `❌ AI Inference failed: ${e.message}`]);
        }
    };

    return (
        <div className="min-h-screen bg-navy-900 text-slate-300 p-8 font-sans flex flex-col items-center">
            <div className="w-full max-w-6xl">
                <header className="mb-6 flex justify-between items-center bg-navy-800 p-6 rounded-lg border border-navy-700 shadow-lg">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                            <Upload className="text-blue-400" />
                            Strategic Ingestion
                        </h1>
                        <p className="text-slate-400 text-sm">Review, Cleanse, and Import Legacy Data.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => navigate('/command-center')}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleImport}
                            disabled={!isValid || uploading}
                            isLoading={uploading}
                            className={isValid ? 'bg-green-600 hover:bg-green-500' : 'opacity-50 cursor-not-allowed'}
                        >
                            <CheckCircle size={16} className="mr-2" />
                            Import {stagingData.length} Records
                        </Button>
                    </div>
                </header>

                {/* Staging Area */}
                <div className="bg-navy-800 border border-navy-700 rounded-lg shadow-xl overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 bg-navy-900/50 border-b border-navy-700 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* File Upload */}
                            <label className="flex items-center gap-2 cursor-pointer bg-navy-700 hover:bg-navy-600 px-3 py-1.5 rounded text-sm text-white transition-colors border border-navy-600">
                                <FileUp size={16} />
                                <span>{file ? 'Change CSV' : 'Upload CSV'}</span>
                                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                            </label>

                            {/* AI Magic */}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={runAiInference}
                                isLoading={isAiProcessing}
                                className="border-purple-500/50 text-purple-300 hover:bg-purple-900/20"
                            >
                                <Wand2 size={14} className="mr-2" />
                                AI Fill Missing Data
                            </Button>
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex items-center gap-2 bg-navy-900 px-3 py-1.5 rounded border border-navy-700">
                            <span className="text-xs uppercase font-bold text-slate-500 mr-2">Bulk Edit:</span>

                            {/* Bulk Focus */}
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    placeholder="Focus"
                                    className="w-16 bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs text-white"
                                    value={bulkFocus}
                                    onChange={e => setBulkFocus(parseInt(e.target.value) || '')}
                                />
                                <button onClick={handleBulkApplyFocus} className="text-xs text-blue-400 hover:text-blue-300 px-2">Apply</button>
                            </div>

                            <div className="w-px h-4 bg-navy-700 mx-2"></div>

                            {/* Bulk Pillar */}
                            <div className="flex items-center gap-1">
                                <select
                                    className="w-32 bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs text-white"
                                    value={bulkPillar}
                                    onChange={e => setBulkPillar(e.target.value)}
                                >
                                    <option value="">Pillar...</option>
                                    {pillars.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                                <button onClick={handleBulkApplyPillar} className="text-xs text-blue-400 hover:text-blue-300 px-2">Apply</button>
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="p-0">
                        <StagingGrid
                            data={stagingData}
                            pillars={pillars}
                            onDataChange={setStagingData}
                        />
                    </div>

                    {/* Footer / Stats */}
                    <div className="p-3 bg-navy-900/80 border-t border-navy-700 flex justify-between items-center text-xs text-slate-500">
                        <div>
                            {!isValid && stagingData.length > 0 && (
                                <span className="flex items-center gap-1 text-red-400 animate-pulse">
                                    <AlertTriangle size={12} />
                                    Missing mandatory fields (marked in red).
                                </span>
                            )}
                        </div>
                        <div>
                            {stagingData.length} records loaded.
                        </div>
                    </div>
                </div>

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="mt-4 w-full bg-black rounded border border-navy-800 p-2 font-mono text-xs text-slate-500 max-h-32 overflow-y-auto">
                        {logs.map((L, i) => <div key={i}>{L}</div>)}
                    </div>
                )}
            </div>
        </div>
    );
};
