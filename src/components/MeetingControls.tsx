
import React from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { Button } from './Button';
import type { Meeting } from '../hooks/useMeetingState';

interface MeetingControlsProps {
    meeting: Meeting | null;
    loading: boolean;
    onStart: () => void;
    onEnd: () => void;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({ meeting, loading, onStart, onEnd }) => {
    if (loading) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
                <Loader2 size={16} className="animate-spin text-slate-500" />
                <span className="text-xs font-mono text-slate-500">Syncing...</span>
            </div>
        );
    }

    if (meeting) {
        return (
            <div className="flex items-center gap-4 px-4 py-2 bg-red-950/40 rounded-lg border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        SESSION LIVE
                    </span>
                    <span className="text-xs font-medium text-red-100">{meeting.title}</span>
                </div>
                <div className="h-8 w-px bg-red-800/50"></div>
                <Button
                    onClick={onEnd}
                    variant="secondary"
                    className="h-8 text-xs bg-red-900/50 text-red-200 border-red-800 hover:bg-red-800 hover:text-white hover:border-red-500 transition-colors"
                >
                    <Square size={12} className="mr-1.5 fill-current" />
                    End Session
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <Button
                onClick={onStart}
                className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-900/20"
            >
                <Play size={14} className="mr-1.5 fill-current" />
                Start Meeting
            </Button>
        </div>
    );
};
