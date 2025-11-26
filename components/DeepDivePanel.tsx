import React from 'react';
import { Terminal, Code, Calculator, ShieldAlert } from 'lucide-react';
import { StepLog } from '../types';

interface Props {
  log: StepLog | null;
}

const DeepDivePanel: React.FC<Props> = ({ log }) => {
  if (!log) {
    return (
      <div className="h-full bg-slate-950 rounded-xl border border-slate-800 p-8 flex flex-col items-center justify-center text-slate-600">
        <Terminal className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-mono text-sm">Waiting for transaction execution...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col font-mono text-sm shadow-2xl">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-400">
          <Terminal className="w-4 h-4" />
          <span className="font-bold tracking-wide">TX_DEBUGGER_CONSOLE</span>
        </div>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
      </div>

      {/* Content Scroll */}
      <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        
        {/* Title Section */}
        <div>
          <h3 className="text-xl font-bold text-slate-200 mb-1 flex items-center gap-2">
            <span className="text-blue-500">>></span> {log.title}
          </h3>
          <p className="text-slate-400 pl-6 border-l-2 border-slate-800 italic">
            {log.description}
          </p>
        </div>

        {/* Formula Section */}
        {log.formula && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-2 text-purple-400 mb-2 text-xs uppercase tracking-wider font-bold">
              <Calculator className="w-3 h-3" /> Mathematical Model
            </div>
            <code className="text-green-400 block bg-black/30 p-2 rounded">
              {log.formula}
            </code>
          </div>
        )}

        {/* State/Mechanics Table */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-400 mb-2 text-xs uppercase tracking-wider font-bold">
            <Code className="w-3 h-3" /> State Changes & Calculations
          </div>
          <div className="grid grid-cols-1 gap-1">
            {log.mechanics.map((entry, idx) => (
              <div 
                key={idx} 
                className={`
                  flex justify-between items-center p-2 rounded border
                  ${entry.highlight 
                    ? 'bg-blue-950/30 border-blue-500/30 text-blue-200' 
                    : 'bg-slate-900/30 border-slate-800 text-slate-400'}
                `}
              >
                <span className="opacity-80">{entry.label}</span>
                <span className={`font-bold ${entry.highlight ? 'text-white' : 'text-slate-300'}`}>
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerability Alert */}
        {log.vulnerabilityNote && (
          <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400 mb-1 text-xs uppercase tracking-wider font-bold">
              <ShieldAlert className="w-3 h-3" /> Security Vulnerability
            </div>
            <p className="text-red-300/80 text-xs leading-relaxed">
              {log.vulnerabilityNote}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default DeepDivePanel;