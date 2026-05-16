import React from 'react';

export const EnvDiagnostic: React.FC = () => {
  const envKeys = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
  
  const envData = {
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
    SSR: import.meta.env.SSR,
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-700 font-mono text-xs">
      <h3 className="text-blue-400 mb-2 font-bold uppercase tracking-wider">Environment Diagnostic v2</h3>
      
      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 border-b border-slate-800 pb-2">
        {Object.entries(envData).map(([k, v]) => (
          <React.Fragment key={k}>
            <div className="text-slate-500">{k}:</div>
            <div className="text-amber-400">{String(v)}</div>
          </React.Fragment>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-slate-500 mb-1 font-bold">Detected VITE_ Variables:</div>
        {envKeys.length === 0 ? (
          <div className="text-rose-400 italic">No VITE_ variables detected!</div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {envKeys.map(key => {
              const val = String(import.meta.env[key]);
              const isDefined = !!val && val !== 'undefined' && val !== 'null';
              return (
                <div key={key} className="flex justify-between border-b border-slate-800/50 py-1">
                  <span className="text-slate-400">{key}</span>
                  <span className={isDefined ? 'text-emerald-400' : 'text-rose-400'}>
                    {isDefined ? `EXISTS (${val.substring(0, 5)}...)` : 'MISSING/EMPTY'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 text-[10px] text-slate-600 italic leading-tight">
        Total import.meta.env keys: {Object.keys(import.meta.env).length}<br/>
        Vercel Build Timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
};
