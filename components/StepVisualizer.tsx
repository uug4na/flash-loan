import React from 'react';
import { ArrowRight, Landmark, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { SimulationStep } from '../types';

interface Props {
  step: SimulationStep;
}

const StepVisualizer: React.FC<Props> = ({ step }) => {
  const isActive = (targetStep: number) => step === targetStep;
  const isPast = (targetStep: number) => step > targetStep;

  // Helper to determine arrow color/animation based on step
  const getArrowClass = (triggerStep: number) => {
    if (step === triggerStep) return "text-yellow-400 animate-pulse scale-110";
    if (step > triggerStep) return "text-green-500 opacity-50";
    return "text-gray-700 opacity-20";
  };

  return (
    <div className="relative w-full h-64 bg-slate-900/50 rounded-xl border border-slate-700 p-6 flex items-center justify-between overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/40 via-slate-900/0 to-slate-900/0 pointer-events-none" />

      {/* Node: Flash Loan Provider */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${step === 1 ? 'scale-110' : 'scale-100'}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-500 bg-blue-900/30' : 'border-slate-600 bg-slate-800'}`}>
          <Landmark className={`w-8 h-8 ${step >= 1 ? 'text-blue-400' : 'text-slate-500'}`} />
        </div>
        <span className="mt-2 text-xs font-bold text-slate-400">Flash Provider</span>
        <span className="text-[10px] text-slate-500">Source of Liquidity</span>
      </div>

      {/* Arrow: Loan */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <ArrowRight className={`w-8 h-8 transition-all duration-500 ${getArrowClass(1)}`} />
        {step === 1 && <span className="absolute -top-4 text-[10px] text-yellow-400 animate-bounce">10M USDC Loan</span>}
        {step === 5 && <span className="absolute -bottom-4 text-[10px] text-red-400 animate-bounce">Repay Loan + Fee</span>}
        {step === 5 && <ArrowRight className={`w-8 h-8 absolute rotate-180 text-red-500 animate-pulse`} />}
      </div>

      {/* Node: Attacker (You) */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${step > 0 ? 'scale-110' : 'scale-100'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${step === 6 ? 'border-green-500 bg-green-900/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : 'border-rose-500 bg-rose-900/20'}`}>
          <Wallet className={`w-10 h-10 ${step === 6 ? 'text-green-400' : 'text-rose-400'}`} />
        </div>
        <span className={`mt-2 text-sm font-bold ${step === 6 ? 'text-green-400' : 'text-rose-400'}`}>Attacker</span>
      </div>

      {/* Arrow: Swap */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Top path: To DEX */}
        <ArrowRight className={`w-8 h-8 -rotate-45 mb-2 transition-all duration-500 ${getArrowClass(2)}`} />
        {step === 2 && <span className="absolute top-0 right-10 text-[10px] text-yellow-400">Buy GEM</span>}
        
        {/* Bottom path: To Lending */}
        <ArrowRight className={`w-8 h-8 rotate-45 mt-2 transition-all duration-500 ${getArrowClass(3)}`} />
        {step === 3 && <span className="absolute bottom-0 right-10 text-[10px] text-yellow-400">Deposit GEM</span>}
      </div>

      <div className="flex flex-col gap-8 h-full justify-center">
        {/* Node: DEX (Oracle) */}
        <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${step === 2 ? 'scale-110 shadow-lg' : 'scale-100'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-purple-500 bg-purple-900/30' : 'border-slate-600 bg-slate-800'}`}>
            <TrendingUp className={`w-6 h-6 ${step >= 2 ? 'text-purple-400' : 'text-slate-500'}`} />
          </div>
          <span className="mt-1 text-xs font-bold text-slate-400">DEX (Oracle)</span>
          {step >= 2 && step < 5 && <span className="absolute -top-6 bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded border border-red-500/50">Price Manipulated!</span>}
        </div>

        {/* Node: Victim Protocol */}
        <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${step === 3 || step === 4 ? 'scale-110 shadow-lg' : 'scale-100'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-orange-500 bg-orange-900/30' : 'border-slate-600 bg-slate-800'}`}>
            <AlertTriangle className={`w-6 h-6 ${step >= 3 ? 'text-orange-400' : 'text-slate-500'}`} />
          </div>
          <span className="mt-1 text-xs font-bold text-slate-400">Lending Protocol</span>
          <span className="text-[10px] text-slate-500">Trusts DEX Price</span>
        </div>
      </div>
      
      {/* Dashed line connecting DEX and Lending Protocol to represent Oracle reading */}
      <div className="absolute right-[3.2rem] top-[7.5rem] w-0.5 h-12 border-l-2 border-dashed border-slate-600/50 z-0"></div>
      <span className="absolute right-[1.5rem] top-[9rem] text-[9px] text-slate-500 rotate-90">Oracle Feed</span>

    </div>
  );
};

export default StepVisualizer;