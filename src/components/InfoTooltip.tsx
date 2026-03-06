import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
    content: string;
    className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className = '' }) => {
    const [visible, setVisible] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const iconRef = useRef<HTMLButtonElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!visible) return;
        const handler = (e: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
                iconRef.current && !iconRef.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [visible]);

    return (
        <span className={`relative inline-flex items-center ${className}`}>
            <button
                ref={iconRef}
                onClick={() => setVisible(!visible)}
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                className="text-slate-500 hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-blue-500/10 focus:outline-none"
                aria-label="More information"
            >
                <Info size={12} />
            </button>
            {visible && (
                <div
                    ref={tooltipRef}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 leading-relaxed z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                    {content}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                </div>
            )}
        </span>
    );
};
