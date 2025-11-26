import React, { useState } from 'react';
import { Terminal, Code, Calculator, ShieldAlert, Activity, FileCode } from 'lucide-react';
import { StepLog } from '../types';

interface Props {
  log: StepLog | null;
}

const DeepDivePanel: React.FC<Props> = ({ log }) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'code'>('monitor');

  if (!log) {
    return (
      <div className="h-full bg-slate-950/50 rounded-xl border border-slate-800/50 p-8 flex flex-col items-center justify-center text-slate-600 backdrop-blur-sm">
        <Activity className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-mono text-xs uppercase tracking-widest opacity-50">Awaiting Transaction Data...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden flex flex-col font-mono text-sm shadow-2xl transition-all duration-300">
      {/* Header & Tabs */}
      <div className="bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-2 pt-2">
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveTab('monitor')}
             className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-bold transition-colors ${activeTab === 'monitor' ? 'bg-slate-800 text-emerald-400 border-t border-x border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Terminal className="w-3.5 h-3.5" />
             MONITOR
           </button>
           <button 
             onClick={() => setActiveTab('code')}
             className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-xs font-bold transition-colors ${activeTab === 'code' ? 'bg-slate-800 text-blue-400 border-t border-x border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <FileCode className="w-3.5 h-3.5" />
             CONTRACT
           </button>
        </div>
        <div className="flex gap-1.5 opacity-50 pb-2 pr-2">
           <div className="w-2 h-2 rounded-full bg-slate-600" />
           <div className="w-2 h-2 rounded-full bg-slate-600" />
        </div>
      </div>

      {/* Content Scroll */}
      <div className="p-5 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex-1 bg-slate-950/50">
        
        {activeTab === 'monitor' ? (
          <>
            {/* Formula Section */}
            {log.formula && (
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 relative group">
                <div className="absolute -left-[1px] top-3 bottom-3 w-[2px] bg-purple-500/50" />
                <div className="flex items-center gap-2 text-purple-400 mb-2 text-[10px] uppercase tracking-wider font-bold">
                  <Calculator className="w-3 h-3" /> Core Logic
                </div>
                <code className="text-purple-200 block text-xs">
                  {log.formula}
                </code>
              </div>
            )}

            {/* State/Mechanics Table */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-400 mb-2 text-[10px] uppercase tracking-wider font-bold">
                <Code className="w-3 h-3" /> State Changes
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {log.mechanics.map((entry, idx) => (
                  <div 
                    key={idx} 
                    className={`
                      flex justify-between items-center px-3 py-2 rounded text-xs border
                      ${entry.highlight 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-100' 
                        : 'bg-slate-800/30 border-slate-800/50 text-slate-400'}
                    `}
                  >
                    <span className="opacity-70">{entry.label}</span>
                    <span className={`font-bold ${entry.highlight ? 'text-white' : 'text-slate-300'}`}>
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vulnerability Alert */}
            {log.vulnerabilityNote && (
              <div className="bg-rose-950/10 border border-rose-500/20 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 text-rose-400 mb-1 text-[10px] uppercase tracking-wider font-bold">
                  <ShieldAlert className="w-3 h-3" /> Vulnerability
                </div>
                <p className="text-rose-200/70 text-xs leading-relaxed">
                  {log.vulnerabilityNote}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-blue-400 mb-2 text-[10px] uppercase tracking-wider font-bold">
                <Code className="w-3 h-3" /> Solidarity Snippet
             </div>
             <div className="bg-[#0d1117] p-4 rounded-lg border border-slate-800 overflow-x-auto">
               <pre className="text-xs font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                 {log.codeSnippet || "// No code available for this step"}
               </pre>
             </div>
             <p className="text-[10px] text-slate-500 mt-2">
               * Actual logic from <span className="font-mono text-slate-400">FlashExploit.sol</span>
             </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default DeepDivePanel;