import React from 'react';

export const EnvDiagnostic: React.FC = () => {
  const env = {
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_GEMINI_API_KEY: !!import.meta.env.VITE_GEMINI_API_KEY,
    VITE_OPENAI_API_KEY: !!import.meta.env.VITE_OPENAI_API_KEY,
    VITE_ANTHROPIC_API_KEY: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
  };

  return (
    <div className="p-4 bg-slate-900 text-slate-100 rounded-lg border border-slate-700 font-mono text-xs">
      <h3 className="text-blue-400 mb-2 font-bold uppercase tracking-wider">Environment Diagnostic</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(env).map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="text-slate-500">{key}:</div>
            <div className={value === true ? 'text-emerald-400' : value === false ? 'text-rose-400' : 'text-amber-400'}>
              {String(value)}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4 text-[10px] text-slate-600 italic">
        * true/false indicates if the key is defined (not its value).
      </div>
    </div>
  );
};
