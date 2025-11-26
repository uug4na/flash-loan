import React from 'react';
import { Landmark, Wallet, TrendingUp, ShieldAlert } from 'lucide-react';
import { SimulationStep } from '../types';

interface Props {
  step: SimulationStep;
}

const StepVisualizer: React.FC<Props> = ({ step }) => {
  // Config for the coordinate system (800x400 internal resolution)
  // Provider: 100, 100 (12.5%, 25%)
  // Attacker: 400, 300 (50%, 75%)
  // DEX:      700, 100 (87.5%, 25%)
  // Protocol: 700, 300 (87.5%, 75%)
  
  const coords = {
    provider: { x: 100, y: 100 },
    attacker: { x: 400, y: 300 },
    dex: { x: 700, y: 100 },
    protocol: { x: 700, y: 300 }
  };

  // Helper to create curved paths (Bezier)
  const createCurvedPath = (start: {x: number, y: number}, end: {x: number, y: number}, bendY: number = 0) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2 + bendY;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const paths = {
    // Provider -> Attacker
    loan: createCurvedPath(coords.provider, coords.attacker, 50),
    // Attacker -> Provider
    repay: createCurvedPath(coords.attacker, coords.provider, -50),
    // Attacker -> DEX
    buyGem: createCurvedPath(coords.attacker, coords.dex, 50),
    // DEX -> Attacker
    receiveGem: createCurvedPath(coords.dex, coords.attacker, -50),
    // Attacker -> Protocol
    deposit: `M ${coords.attacker.x} ${coords.attacker.y} L ${coords.protocol.x} ${coords.protocol.y}`,
    // Protocol -> Attacker
    borrow: createCurvedPath(coords.protocol, coords.attacker, 80),
    // DEX -> Protocol (Oracle)
    oracle: `M ${coords.dex.x} ${coords.dex.y} L ${coords.protocol.x} ${coords.protocol.y}`, 
  };

  const getActiveFlow = () => {
    switch(step) {
      case SimulationStep.FLASH_LOAN: 
        return { path: paths.loan, color: '#4ade80', label: 'Borrow 10M USDC' };
      case SimulationStep.ORACLE_MANIPULATION: 
        return { path: paths.buyGem, color: '#4ade80', secondary: paths.receiveGem, label: 'Swap USDC → GEM' }; 
      case SimulationStep.DEPOSIT_COLLATERAL: 
        return { path: paths.deposit, color: '#a855f7', label: 'Deposit GEM Collateral' };
      case SimulationStep.MAX_BORROW: 
        return { path: paths.borrow, color: '#4ade80', label: 'Borrow Max USDC' };
      case SimulationStep.REPAY_LOAN: 
        return { path: paths.repay, color: '#f87171', label: 'Repay Flash Loan' };
      default: return null;
    }
  };

  const activeFlow = getActiveFlow();

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Container maintains 2:1 aspect ratio to match coordinate system */}
      <div className="relative w-full max-w-[800px] aspect-[2/1] bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-visible">
        
        {/* Grid Background */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none" />
        </div>

        {/* SVG Layer for Lines & Particles */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#334155" stopOpacity="1" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Static Connection Lines */}
          <path d={paths.loan} stroke="#334155" strokeWidth="2" strokeDasharray="5,5" fill="none" opacity="0.5" />
          <path d={paths.buyGem} stroke="#334155" strokeWidth="2" strokeDasharray="5,5" fill="none" opacity="0.5" />
          <path d={paths.deposit} stroke="#334155" strokeWidth="2" strokeDasharray="5,5" fill="none" opacity="0.5" />
          <path d={paths.oracle} stroke="#6366f1" strokeWidth="2" strokeDasharray="4,4" fill="none" opacity="0.4" />

          {/* Active Flow Animation */}
          {activeFlow && (
            <>
              {/* The glowing path line */}
              <path d={activeFlow.path} stroke={activeFlow.color} strokeWidth="3" fill="none" strokeOpacity="0.4" filter="url(#glow)" />
              
              {/* The moving particle */}
              <circle r="6" fill={activeFlow.color} className="particle" style={{ '--path': `path('${activeFlow.path}')` } as React.CSSProperties} />
              
              {/* Secondary Flow (e.g. swap return) */}
              {activeFlow.secondary && (
                <>
                   <path d={activeFlow.secondary} stroke="#a855f7" strokeWidth="3" fill="none" strokeOpacity="0.4" filter="url(#glow)" />
                   <circle r="6" fill="#a855f7" className="particle" style={{ '--path': `path('${activeFlow.secondary}')`, animationDelay: '0.75s' } as React.CSSProperties} />
                </>
              )}
            </>
          )}
        </svg>

        {/* --- Nodes (Positioned with %) --- */}

        {/* Flash Provider (Top Left) */}
        <div className="absolute top-[25%] left-[12.5%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 bg-slate-900 shadow-xl transition-all duration-500 ${step === 1 || step === 5 ? 'border-green-400 scale-110 shadow-green-900/50' : 'border-slate-700'}`}>
            <Landmark className={`w-6 h-6 md:w-8 md:h-8 ${step === 1 ? 'text-green-400' : 'text-slate-500'}`} />
          </div>
          <span className="mt-2 text-[10px] md:text-xs font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">Liquidity</span>
        </div>

        {/* DEX (Top Right) */}
        <div className="absolute top-[25%] left-[87.5%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 bg-slate-900 shadow-xl transition-all duration-500 ${step === 2 ? 'border-purple-400 scale-110 shadow-purple-900/50' : 'border-slate-700'}`}>
            <TrendingUp className={`w-6 h-6 md:w-8 md:h-8 ${step === 2 ? 'text-purple-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2 flex flex-col items-center">
             <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">DEX</span>
             {step >= 2 && step <= 4 && (
                <span className="text-[9px] font-bold text-red-400 animate-pulse mt-0.5 whitespace-nowrap px-1 bg-red-950/30 rounded">HIGH PRICE</span>
             )}
          </div>
        </div>

        {/* Protocol (Bottom Right) */}
        <div className="absolute top-[75%] left-[87.5%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 bg-slate-900 shadow-xl transition-all duration-500 ${step === 3 || step === 4 ? 'border-orange-400 scale-110 shadow-orange-900/50' : 'border-slate-700'}`}>
            <ShieldAlert className={`w-6 h-6 md:w-8 md:h-8 ${step === 3 || step === 4 ? 'text-orange-400' : 'text-slate-500'}`} />
          </div>
          <span className="mt-2 text-[10px] md:text-xs font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">Lending</span>
          
          {/* Oracle Feed Indicator */}
          <div className="absolute -top-[100px] right-full translate-x-1/2 flex flex-col items-center opacity-50">
             <div className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1 rounded border border-indigo-500/20">Oracle</div>
          </div>
        </div>

        {/* Attacker (Center Bottom) */}
        <div className="absolute top-[75%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-4 bg-slate-900 shadow-2xl transition-all duration-500 ${step > 0 ? 'scale-110' : 'scale-100'} ${step === 6 ? 'border-green-500 shadow-green-500/50' : 'border-rose-500 shadow-rose-900/20'}`}>
            <Wallet className={`w-8 h-8 md:w-10 md:h-10 ${step === 6 ? 'text-green-400' : 'text-rose-400'}`} />
          </div>
          <span className={`mt-3 px-3 py-1 rounded-full text-xs md:text-sm font-bold border bg-slate-900/90 backdrop-blur-md ${step === 6 ? 'text-green-400 border-green-500/30' : 'text-rose-400 border-rose-500/30'}`}>
             Attacker
          </span>
        </div>

        {/* Floating Action Label */}
        {activeFlow && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div className="bg-slate-800/95 border border-yellow-500/40 text-yellow-300 px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-2xl shadow-yellow-900/20 backdrop-blur animate-bounce whitespace-nowrap">
                 {activeFlow.label}
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default StepVisualizer;
