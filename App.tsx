import React, { useState } from 'react';
import { SimulationStep, WalletState, ProtocolState, StepLog } from './types';
import StepVisualizer from './components/StepVisualizer';
import DeepDivePanel from './components/DeepDivePanel';
import EducationSlideover from './components/EducationSlideover';
import { Play, RotateCcw, ChevronRight, Info, DollarSign, Wallet, TrendingUp, Cpu, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// --- Constants & Config ---
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
const BORROW_SAFE_MARGIN = 0.9;       // Borrow 90% of max

export default function App() {
  const [step, setStep] = useState<SimulationStep>(SimulationStep.IDLE);
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);
  const [protocol, setProtocol] = useState<ProtocolState>(INITIAL_PROTOCOL);
  const [currentLog, setCurrentLog] = useState<StepLog | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [priceHistory, setPriceHistory] = useState<{step: number, price: number}[]>([
    { step: 0, price: INITIAL_PRICE }
  ]);

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
          description: "We borrow 10,000,000 USDC from a Flash Loan Provider. This unsecured loan gives us massive buying power (Whale status) but must be repaid in the same block.",
          formula: "Debt = Loan + (Loan * 0.0009)",
          mechanics: [
            { label: "Loan Amount", value: fmt(FLASH_LOAN_AMOUNT), highlight: true },
            { label: "Protocol Fee (0.09%)", value: fmt(fee) },
            { label: "Total Debt Due", value: fmt(FLASH_LOAN_AMOUNT + fee), highlight: true },
            { label: "Block Valid", value: "YES (Pending Repayment)" }
          ],
          codeSnippet: `// FlashExploit.sol
function attack(address provider, uint256 borrowAmount) external {
    // 1. Request Flash Loan
    IFlashLoanProvider(provider).flashLoan(borrowAmount);
}`,
          vulnerabilityNote: "Flash loans allow anyone to become a temporary whale. The vulnerability isn't the loan itself, but how this capital is used to manipulate other protocols."
        };
        break;
      }

      case SimulationStep.ORACLE_MANIPULATION: {
        const x = newProtocol.poolLiquidityUsdc;
        const y = newProtocol.poolLiquidityGem;
        const k = x * y; 

        const dx = SWAP_AMOUNT; 
        const newX = x + dx;
        const newY = k / newX;
        const dy = y - newY; 
        const newPrice = newX / newY;

        newWallet.usdc -= dx;
        newWallet.gemToken += dy;
        newProtocol.poolLiquidityUsdc = newX;
        newProtocol.poolLiquidityGem = newY;
        newProtocol.dexPrice = newPrice;
        newProtocol.oraclePrice = newPrice; 

        stepLog = {
          title: "Market Manipulation",
          description: "We dump 5M USDC into the low-liquidity DEX. This massive buy order shifts the AMM curve drastically, pumping the spot price of GEM from $10 to $" + fmtNum(newPrice) + ".",
          formula: "k = x * y (Constant Product AMM)",
          mechanics: [
            { label: "Initial Pool", value: `${fmtNum(x)} USDC / ${fmtNum(y)} GEM` },
            { label: "Swap Input", value: fmt(dx), highlight: true },
            { label: "New Price", value: `$${fmtNum(newPrice)}`, highlight: true },
            { label: "Price Increase", value: `+${((newPrice/INITIAL_PRICE - 1)*100).toFixed(0)}%` }
          ],
          codeSnippet: `// FlashExploit.sol -> executeOperation
// --- STEP 1: MARKET MANIPULATION ---
uint256 swapAmount = 5_000_000 * 10**18;
usdc.approve(address(dex), swapAmount);

// Buy GEM, pumping the price in the shallow DEX
uint256 gemBought = dex.swapUSDCForGem(swapAmount);`,
          vulnerabilityNote: "The lending protocol's Oracle updates instantly based on this spot price. It now believes GEM is worth way more than it actually is."
        };
        break;
      }

      case SimulationStep.DEPOSIT_COLLATERAL: {
        const collateralValue = newWallet.gemToken * newProtocol.oraclePrice;
        
        stepLog = {
          title: "Strategic Deposit",
          description: "We deposit our GEM tokens into the Lending Protocol. Because the Oracle is manipulated, the protocol values our deposit at the inflated price.",
          formula: "CollateralValue = Amount * OraclePrice",
          mechanics: [
            { label: "Deposit Amount", value: fmtNum(newWallet.gemToken) + " GEM" },
            { label: "Oracle Price", value: fmt(newProtocol.oraclePrice), highlight: true },
            { label: "Real Market Value", value: fmt(newWallet.gemToken * INITIAL_PRICE) },
            { label: "Protocol Perceived Value", value: fmt(collateralValue), highlight: true }
          ],
          codeSnippet: `// FlashExploit.sol
// --- STEP 2: DEPOSIT INFLATED ASSET ---
gem.approve(address(pool), gemBought);

// Protocol trusts DEX spot price:
// uint256 price = dex.getSpotPrice(); 
// uint256 val = (collateral * price) / 1e18;
pool.deposit(gemBought);`,
          vulnerabilityNote: "The protocol sees $100M+ in collateral value, when in reality the market depth cannot support selling this amount at this price."
        };
        break;
      }

      case SimulationStep.MAX_BORROW: {
        const collateralValue = newWallet.gemToken * newProtocol.oraclePrice;
        const maxBorrow = collateralValue * newProtocol.collateralFactor;
        const borrowAmount = Math.floor(maxBorrow * BORROW_SAFE_MARGIN);

        newWallet.usdc += borrowAmount;
        
        stepLog = {
          title: "Exploitative Borrow",
          description: "Now we borrow real stablecoins (USDC) against our inflated collateral. We borrow more USDC than the actual value of the GEM tokens we deposited.",
          formula: "MaxBorrow = CollateralValue * LTV",
          mechanics: [
            { label: "Collateral Value", value: fmt(collateralValue) },
            { label: "LTV Factor", value: `${protocol.collateralFactor * 100}%` },
            { label: "Max Borrow Limit", value: fmt(maxBorrow) },
            { label: "Actual Borrow", value: fmt(borrowAmount), highlight: true }
          ],
          codeSnippet: `// FlashExploit.sol
// --- STEP 3: EXPLOITATIVE BORROW ---
// Because DEX price is high, Pool thinks we are rich.
// We borrow all the USDC the pool has.

uint256 poolBalance = usdc.balanceOf(address(pool));
pool.borrow(poolBalance);`,
          vulnerabilityNote: "We have effectively 'cashed out' the manipulated value. Even if the price crashes now, we hold the borrowed USDC."
        };
        break;
      }

      case SimulationStep.REPAY_LOAN: {
        const fee = FLASH_LOAN_AMOUNT * 0.0009;
        const totalRepay = FLASH_LOAN_AMOUNT + fee;
        newWallet.usdc -= totalRepay;
        newWallet.debt = 0;

        stepLog = {
          title: "Cleanup & Repayment",
          description: "We repay the Flash Loan provider (10M USDC + 0.09% fee). This unlocks the transaction validation, ensuring the entire sequence is recorded on-chain.",
          mechanics: [
            { label: "Wallet Balance", value: fmt(newWallet.usdc + totalRepay) },
            { label: "Repayment Amount", value: "-" + fmt(totalRepay), highlight: true },
            { label: "Transaction Status", value: "SUCCESS" }
          ],
          codeSnippet: `// FlashExploit.sol
// --- STEP 4: REPAY FLASH LOAN ---
uint256 amountOwed = amount + fee;

// Repay the provider to prevent revert
usdc.transfer(msg.sender, amountOwed);`,
          vulnerabilityNote: "The flash loan is paid back, so the provider is happy. The lending protocol is left holding the bag (overvalued collateral)."
        };
        break;
      }

      case SimulationStep.PROFIT: {
        const initialUsdc = 1000;
        const profit = newWallet.usdc - initialUsdc;
        
        stepLog = {
          title: "Attack Complete",
          description: "We walk away with pure profit. The lending protocol is insolvent because the collateral (GEM) value will revert to $10, leaving them with bad debt.",
          mechanics: [
            { label: "Initial Capital", value: fmt(initialUsdc) },
            { label: "Final Capital", value: fmt(newWallet.usdc) },
            { label: "Net Profit", value: fmt(profit), highlight: true },
            { label: "Protocol Status", value: "INSOLVENT" }
          ],
          codeSnippet: `// FlashExploit.sol
// --- STEP 5: PROFIT ---
uint256 profit = usdc.balanceOf(address(this));

// Send pure profit to the attacker's EOA
usdc.transfer(owner, profit);`,
          vulnerabilityNote: "This attack happened in a single transaction. Traditional circuit breakers often fail to catch this speed of execution."
        };
        break;
      }
      
      default:
         stepLog = {
            title: "Initialization",
            description: "System initialized. Waiting for user input.",
            mechanics: []
         };
    }

    setWallet(newWallet);
    setProtocol(newProtocol);
    setCurrentLog(stepLog);
    
    setPriceHistory(prev => [...prev, { step: currentStep, price: newProtocol.dexPrice }]);
  };

  const fmt = (num: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans selection:bg-rose-500/30">
      <EducationSlideover isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <Cpu className="w-8 h-8 text-emerald-500" />
              DeFi Exploit Sim
            </h1>
            <p className="text-slate-400 text-sm mt-1 ml-11">Visualizing Flash Loan Oracle Manipulation Attacks</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
             <button
               onClick={() => setIsGuideOpen(true)}
               className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
             >
               <BookOpen className="w-4 h-4" />
               Concept Guide
             </button>

             <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
               <span className="text-xs text-slate-500 uppercase font-bold">Block Status</span>
               <div className={`w-2 h-2 rounded-full ${step > 0 && step < 6 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
               <span className="text-xs font-mono text-slate-300">
                  {step > 0 && step < 6 ? 'PENDING' : 'CONFIRMED'}
               </span>
             </div>
             <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                RESET
              </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Dashboard (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Wallet Stats */}
            <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-5 shadow-lg overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Wallet className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm font-bold text-slate-300">Attacker Wallet</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">USDC Balance</div>
                  <div className={`text-2xl font-mono font-bold tracking-tight ${step === 6 ? 'text-green-400' : 'text-white'}`}>
                    {fmt(wallet.usdc)}
                  </div>
                </div>
                <div>
                   <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Assets</div>
                   <div className="flex justify-between items-center text-sm font-mono text-slate-300 bg-slate-950 p-2 rounded">
                      <span>GEM</span>
                      <span>{wallet.gemToken.toLocaleString()}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Protocol Stats */}
            <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-5 shadow-lg hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-sm font-bold text-slate-300">Market Data</span>
              </div>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-500">Spot Price</span>
                    <span className={`font-mono font-bold text-lg ${protocol.dexPrice > 20 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                       ${protocol.dexPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex justify-between text-xs text-slate-400">
                      <span>Pool USDC</span>
                      <span className="font-mono">{protocol.poolLiquidityUsdc.toLocaleString(undefined, {notation: 'compact'})}</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-400">
                      <span>Pool GEM</span>
                      <span className="font-mono">{protocol.poolLiquidityGem.toLocaleString(undefined, {notation: 'compact'})}</span>
                   </div>
                   {/* Liquidity Bar */}
                   <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                      <div 
                         className="h-full bg-blue-500 transition-all duration-700"
                         style={{ width: `${(protocol.poolLiquidityUsdc / (protocol.poolLiquidityUsdc + protocol.poolLiquidityGem * protocol.dexPrice)) * 100}%` }} 
                      />
                   </div>
                 </div>
              </div>
            </div>

             {/* Price Chart */}
             <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-slate-800 p-4 shadow-lg h-48">
                 <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Price Impact</div>
                 <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <YAxis stroke="#475569" tick={{fontSize: 10}} domain={['auto', 'auto']} width={30} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#c084fc' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#c084fc" 
                      strokeWidth={2}
                      dot={false}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
            </div>

          </div>

          {/* Center Column: Visualization (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Simulation Canvas */}
            <StepVisualizer step={step} />

            {/* Narrative Control Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500" />
               
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {currentLog ? currentLog.title : "Ready to Start"}
                    </h3>
                    <div className="flex gap-2">
                       <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Step {step} of {SimulationStep.PROFIT}
                       </span>
                    </div>
                  </div>
                  {step < SimulationStep.PROFIT && (
                    <button
                      onClick={handleNextStep}
                      className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                      {step === SimulationStep.IDLE ? "Start Attack" : "Next Step"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
               </div>
               
               <p className="text-slate-300 text-sm leading-relaxed">
                  {currentLog ? currentLog.description : "Click the button above to begin the simulation. Observe how a lack of liquidity and a naive Oracle implementation can be exploited."}
               </p>
            </div>
          </div>

          {/* Right Column: Deep Dive (3 cols) */}
          <div className="lg:col-span-3">
             <DeepDivePanel log={currentLog} />
          </div>

        </div>
      </div>
    </div>
  );
}