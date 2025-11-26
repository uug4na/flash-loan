import React, { useState, useCallback } from 'react';
import { SimulationStep, WalletState, ProtocolState, StepLog } from './types';
import StepVisualizer from './components/StepVisualizer';
import DeepDivePanel from './components/DeepDivePanel';
import { explainStep } from './services/geminiService';
import { Play, RotateCcw, ChevronRight, Info, ShieldAlert, DollarSign, Wallet, TrendingUp, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Constants & Config ---
// Using lower liquidity to simulate a vulnerable pool where a 10M loan has massive impact
const INITIAL_LIQUIDITY_USDC = 1_000_000; // 1M USDC
const INITIAL_LIQUIDITY_GEM = 100_000;    // 100k GEM
const INITIAL_PRICE = 10;                 // $10 per GEM

const INITIAL_WALLET: WalletState = {
  usdc: 1000,
  gemToken: 0,
  debt: 0
};

const INITIAL_PROTOCOL: ProtocolState = {
  dexPrice: INITIAL_PRICE,
  poolLiquidityUsdc: INITIAL_LIQUIDITY_USDC,
  poolLiquidityGem: INITIAL_LIQUIDITY_GEM,
  oraclePrice: INITIAL_PRICE,
  collateralFactor: 0.8 // 80% LTV
};

const FLASH_LOAN_AMOUNT = 10_000_000; // 10M USDC
const SWAP_AMOUNT = 5_000_000;        // 5M USDC to pump
const BORROW_SAFE_MARGIN = 0.9;       // Borrow 90% of max to be "safe" from liquidation instantly

export default function App() {
  const [step, setStep] = useState<SimulationStep>(SimulationStep.IDLE);
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);
  const [protocol, setProtocol] = useState<ProtocolState>(INITIAL_PROTOCOL);
  const [explanation, setExplanation] = useState<string>("Ready to start simulation. Click 'Start Attack Simulation' to begin.");
  const [loadingAi, setLoadingAi] = useState(false);
  const [currentLog, setCurrentLog] = useState<StepLog | null>(null);
  
  const [priceHistory, setPriceHistory] = useState<{step: number, price: number}[]>([
    { step: 0, price: INITIAL_PRICE }
  ]);

  const updateAiExplanation = useCallback(async (currentStep: SimulationStep, data: any, log: StepLog) => {
    setLoadingAi(true);
    // We pass the log mechanics to the AI so it can explain the math
    const enhancedContext = { ...data, mechanics: log.mechanics };
    const text = await explainStep(currentStep, enhancedContext);
    setExplanation(text);
    setLoadingAi(false);
  }, []);

  const handleNextStep = () => {
    const nextStep = step + 1;
    if (nextStep > SimulationStep.PROFIT) return;
    setStep(nextStep);
    executeStepLogic(nextStep);
  };

  const handleReset = () => {
    setStep(SimulationStep.IDLE);
    setWallet(INITIAL_WALLET);
    setProtocol(INITIAL_PROTOCOL);
    setPriceHistory([{ step: 0, price: INITIAL_PRICE }]);
    setExplanation("Simulation reset. Ready to start.");
    setCurrentLog(null);
  };

  const executeStepLogic = (currentStep: SimulationStep) => {
    let newWallet = { ...wallet };
    let newProtocol = { ...protocol };
    let stepLog: StepLog;

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    const fmtNum = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);

    switch (currentStep) {
      case SimulationStep.FLASH_LOAN: {
        newWallet.usdc += FLASH_LOAN_AMOUNT;
        newWallet.debt += FLASH_LOAN_AMOUNT;
        const fee = FLASH_LOAN_AMOUNT * 0.0009;
        
        stepLog = {
          title: "Flash Loan Execution",
          description: "Borrowed 10,000,000 USDC with 0 collateral. This must be repaid in the same transaction block.",
          formula: "Debt = Loan + (Loan * 0.0009)",
          mechanics: [
            { label: "Loan Amount", value: fmt(FLASH_LOAN_AMOUNT), highlight: true },
            { label: "Protocol Fee (0.09%)", value: fmt(fee) },
            { label: "Total Debt Due", value: fmt(FLASH_LOAN_AMOUNT + fee), highlight: true },
            { label: "Block Valid", value: "YES (Pending Repayment)" }
          ],
          vulnerabilityNote: "Flash loans allow attackers to access massive capital without risk, provided the transaction succeeds."
        };
        break;
      }

      case SimulationStep.ORACLE_MANIPULATION: {
        // AMM Math: x * y = k
        const x = newProtocol.poolLiquidityUsdc;
        const y = newProtocol.poolLiquidityGem;
        const k = x * y; // Constant Product

        const dx = SWAP_AMOUNT; // Adding 5M USDC
        const newX = x + dx;
        const newY = k / newX;
        const dy = y - newY; // GEMs received
        
        // Spot Price = newX / newY (simplified spot price after trade)
        const newPrice = newX / newY;

        newWallet.usdc -= dx;
        newWallet.gemToken += dy;
        newProtocol.poolLiquidityUsdc = newX;
        newProtocol.poolLiquidityGem = newY;
        newProtocol.dexPrice = newPrice;
        newProtocol.oraclePrice = newPrice; // Oracle updates instantly (Vulnerability)

        stepLog = {
          title: "Oracle Manipulation (Spot Price Pump)",
          description: "Swapping huge USDC for GEM on a low-liquidity AMM. This unbalances the pool and skyrockets the price.",
          formula: "k = x * y (Constant Product AMM)",
          mechanics: [
            { label: "Initial Pool", value: `${fmtNum(x)} USDC / ${fmtNum(y)} GEM` },
            { label: "Swap Input", value: fmt(dx), highlight: true },
            { label: "New Pool (x)", value: fmt(newX) },
            { label: "New Pool (y)", value: fmtNum(newY) + " GEM" },
            { label: "Price Impact", value: `$${INITIAL_PRICE} -> $${fmtNum(newPrice)}`, highlight: true },
            { label: "Gems Received", value: fmtNum(dy) }
          ],
          vulnerabilityNote: "The lending protocol uses the 'Spot Price' from this DEX as its source of truth. By manipulating the DEX, we manipulate the Oracle."
        };
        break;
      }

      case SimulationStep.DEPOSIT_COLLATERAL: {
        // Value = Amount * Price
        const collateralValue = newWallet.gemToken * newProtocol.oraclePrice;
        
        stepLog = {
          title: "Collateral Deposit",
          description: "Depositing the recently bought GEM tokens into the lending protocol. The protocol values them at the manipulated high price.",
          formula: "CollateralValue = Amount * OraclePrice",
          mechanics: [
            { label: "Deposit Amount", value: fmtNum(newWallet.gemToken) + " GEM" },
            { label: "Oracle Price", value: fmt(newProtocol.oraclePrice), highlight: true },
            { label: "Real Market Value", value: fmt(newWallet.gemToken * INITIAL_PRICE) },
            { label: "Protocol Perceived Value", value: fmt(collateralValue), highlight: true }
          ],
          vulnerabilityNote: "The protocol believes your collateral is worth millions because it blindly trusts the manipulated DEX price."
        };
        break;
      }

      case SimulationStep.MAX_BORROW: {
        const collateralValue = newWallet.gemToken * newProtocol.oraclePrice;
        const maxBorrow = collateralValue * newProtocol.collateralFactor;
        const borrowAmount = Math.floor(maxBorrow * BORROW_SAFE_MARGIN); // Borrow slightly less than max

        newWallet.usdc += borrowAmount;
        // In a real exploit, we don't plan to pay this "borrow" debt back. We default.
        
        stepLog = {
          title: "Exploitative Borrow",
          description: "Borrowing stablecoins (USDC) against the inflated collateral value.",
          formula: "MaxBorrow = CollateralValue * LTV",
          mechanics: [
            { label: "Collateral Value", value: fmt(collateralValue) },
            { label: "LTV Factor", value: `${protocol.collateralFactor * 100}%` },
            { label: "Max Borrow Limit", value: fmt(maxBorrow) },
            { label: "Actual Borrow", value: fmt(borrowAmount), highlight: true }
          ],
          vulnerabilityNote: "We have now extracted hard assets (USDC) based on temporary, manipulated paper wealth."
        };
        break;
      }

      case SimulationStep.REPAY_LOAN: {
        const fee = FLASH_LOAN_AMOUNT * 0.0009;
        const totalRepay = FLASH_LOAN_AMOUNT + fee;
        newWallet.usdc -= totalRepay;
        newWallet.debt = 0;

        stepLog = {
          title: "Flash Loan Repayment",
          description: "Repaying the initial 10M loan + fees to ensure the transaction doesn't revert.",
          mechanics: [
            { label: "Wallet Balance", value: fmt(newWallet.usdc + totalRepay) },
            { label: "Flash Loan Repayment", value: "-" + fmt(totalRepay), highlight: true },
            { label: "Remaining Balance", value: fmt(newWallet.usdc), highlight: true }
          ],
          vulnerabilityNote: "As long as we have enough USDC to repay the flash provider, the transaction is valid. We keep the difference."
        };
        break;
      }

      case SimulationStep.PROFIT: {
        const initialUsdc = 1000;
        const profit = newWallet.usdc - initialUsdc;
        
        stepLog = {
          title: "Profit Realization",
          description: "The attack is complete. We walk away with the excess USDC. The lending protocol is left with overvalued GEM tokens that will crash in price.",
          mechanics: [
            { label: "Initial Balance", value: fmt(initialUsdc) },
            { label: "Final Balance", value: fmt(newWallet.usdc) },
            { label: "Net Profit", value: fmt(profit), highlight: true },
            { label: "Protocol Bad Debt", value: "Insolvent" }
          ],
          vulnerabilityNote: "This represents a pure arbitrage extracted from the protocol's bad pricing data."
        };
        break;
      }
      
      default:
         stepLog = {
            title: "Initialization",
            description: "System initialized.",
            mechanics: []
         };
    }

    setWallet(newWallet);
    setProtocol(newProtocol);
    setCurrentLog(stepLog);
    
    setPriceHistory(prev => [...prev, { step: currentStep, price: newProtocol.dexPrice }]);
    updateAiExplanation(currentStep, { wallet: newWallet, protocol: newProtocol }, stepLog);
  };

  const fmt = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans selection:bg-rose-500/30">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
              Flash Loan Exploit Simulator
            </h1>
            <p className="text-slate-400 text-sm mt-1 ml-11">Interactive Deep Dive into Oracle Manipulation</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
             <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${step > 0 && step < 6 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                <span className="text-xs font-mono text-slate-400">BLOCK: #18293402</span>
             </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          
          {/* Left Column: Stats & Controls (3 cols) */}
          <div className="lg:col-span-3 space-y-4 flex flex-col">
            
            {/* Wallet Card */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <DollarSign className="w-20 h-20 text-rose-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Wallet className="w-4 h-4" /> Attacker Wallet
              </h2>
              <div className="space-y-3 relative z-10">
                <div>
                  <div className="text-xs text-slate-500 mb-1">USDC Balance</div>
                  <div className={`text-2xl font-mono font-bold ${step === 6 ? 'text-green-400' : 'text-white'}`}>
                    {fmt(wallet.usdc)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">GEM Token Balance</div>
                  <div className="text-lg font-mono text-purple-300">{wallet.gemToken.toLocaleString(undefined, { maximumFractionDigits: 0 })} GEM</div>
                </div>
                {wallet.debt > 0 && (
                  <div className="pt-2 border-t border-slate-800/50">
                    <div className="text-xs text-red-400 mb-1">Active Flash Loan Debt</div>
                    <div className="text-lg font-mono text-red-400">{fmt(wallet.debt)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Protocol Card */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg flex-1">
               <h2 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Market State
              </h2>
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">True Value</span>
                    <span className="font-mono text-slate-300 text-sm">$10.00</span>
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500">DEX Spot Price</span>
                      <span className={`font-mono font-bold ${protocol.dexPrice > 20 ? 'text-red-400' : 'text-slate-300'}`}>
                        ${protocol.dexPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full transition-all duration-700 ease-out" 
                        style={{ width: `${Math.min((protocol.dexPrice / 400) * 100, 100)}%` }}
                      />
                    </div>
                 </div>
                 <div className="p-3 bg-slate-800/50 rounded border border-slate-700/50">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">Liquidity Pool (K)</div>
                    <div className="text-xs font-mono text-slate-400">{protocol.poolLiquidityUsdc.toLocaleString(undefined, {notation: 'compact'})} USDC</div>
                    <div className="text-xs font-mono text-slate-400">{protocol.poolLiquidityGem.toLocaleString(undefined, {notation: 'compact'})} GEM</div>
                 </div>
              </div>
            </div>
            
             <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-sm text-slate-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Simulation
              </button>

          </div>

          {/* Center Column: Visualization & Controls (6 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Main Viz */}
            <StepVisualizer step={step} />

            {/* AI Explanation Box */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 min-h-[160px] flex flex-col shadow-lg">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">AI Analyst</h3>
              </div>
              <div className="flex-1 text-sm text-slate-300 leading-relaxed animate-in fade-in duration-500">
                {loadingAi ? (
                  <div className="flex items-center gap-2 text-slate-500">
                     <span className="animate-pulse">Analyzing transaction trace...</span>
                  </div>
                ) : (
                  explanation
                )}
              </div>
            </div>

             {/* Action Button */}
             <button
                onClick={handleNextStep}
                disabled={step >= SimulationStep.PROFIT}
                className={`
                  w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2
                  ${step >= SimulationStep.PROFIT 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                    : 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-rose-900/20 hover:scale-[1.02] active:scale-[0.98]'
                  }
                `}
              >
                {step === SimulationStep.IDLE ? <Play className="w-5 h-5 fill-current" /> : <ChevronRight className="w-5 h-5" />}
                {step === SimulationStep.IDLE ? "Start Simulation" : "Execute Next Step"}
              </button>

            {/* Price Chart Mini */}
            <div className="h-40 bg-slate-900 rounded-xl border border-slate-800 p-4">
                 <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="step" hide />
                  <YAxis stroke="#475569" tick={{fontSize: 10}} width={30} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                    itemStyle={{ color: '#c084fc' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="price" 
                    stroke="#c084fc" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#c084fc' }}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Right Column: Deep Dive (3 cols) */}
          <div className="lg:col-span-4 h-full min-h-[500px]">
             <DeepDivePanel log={currentLog} />
          </div>

        </div>

      </div>
    </div>
  );
}
