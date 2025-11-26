import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, RefreshCcw, Layers, Database, Code2, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Box, User, Clock, History, Key, Lock, Fingerprint, Globe, Server, Banknote } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// --- Internal Components for Slides ---

// 1. Atomicity Simulator (The "Why" & "How" combined)
const AtomicitySlide = () => {
  const [blockStatus, setBlockStatus] = useState<'idle' | 'mining' | 'finalized'>('idle');
  const [txStates, setTxStates] = useState([
    { id: 'tx-1', user: 'Alice', action: 'Buy NFT', status: 'idle', balance: 100 },  // Random Tx
    { id: 'tx-2', user: 'YOU', action: 'Flash Loan', status: 'idle', balance: 0 },    // The User
    { id: 'tx-3', user: 'Bob', action: 'Send ETH', status: 'idle', balance: 50 },    // Random Tx
  ]);
  const [attackResult, setAttackResult] = useState<'success' | 'fail'>('success');

  const runBlock = (shouldFail: boolean) => {
    setAttackResult(shouldFail ? 'fail' : 'success');
    setBlockStatus('mining');
    
    // Reset
    setTxStates(prev => prev.map(tx => ({ ...tx, status: 'pending' })));

    // Simulation Sequence
    // 1. Start all
    setTimeout(() => {
       // Alice Succeeds
       setTxStates(prev => prev.map(tx => tx.id === 'tx-1' ? { ...tx, status: 'success', balance: 80 } : tx));
    }, 1000);

    setTimeout(() => {
       // Bob Succeeds
       setTxStates(prev => prev.map(tx => tx.id === 'tx-3' ? { ...tx, status: 'success', balance: 40 } : tx));
    }, 1500);

    setTimeout(() => {
       // YOU - The Flash Loan Logic
       setTxStates(prev => prev.map(tx => tx.id === 'tx-2' ? { ...tx, status: 'processing', balance: 1000000 } : tx)); // Got Loan
       
       setTimeout(() => {
         if (shouldFail) {
            // Fail & Revert
            setTxStates(prev => prev.map(tx => tx.id === 'tx-2' ? { ...tx, status: 'reverting' } : tx));
            
            setTimeout(() => {
               setTxStates(prev => prev.map(tx => tx.id === 'tx-2' ? { ...tx, status: 'reverted', balance: 0 } : tx)); // Balance reset!
               setBlockStatus('finalized');
            }, 800);
         } else {
            // Success
            setTxStates(prev => prev.map(tx => tx.id === 'tx-2' ? { ...tx, status: 'success', balance: 1050000 } : tx));
            setBlockStatus('finalized');
         }
       }, 1200);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <History className="w-8 h-8 text-orange-400" />
          The Time Machine: Isolated Reverts
        </h3>
        <p className="text-slate-400 max-w-3xl">
          One of the hardest concepts for beginners: <strong>How can you rewind time for yourself, while everyone else keeps moving forward?</strong>
          <br/>
          In a blockchain "Block", many transactions happen at the same time. If <em>yours</em> fails, only <em>your</em> changes are undone. 
          Alice and Bob are unaffected.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full flex flex-col justify-center">
             <h4 className="font-bold text-white mb-4 border-b border-slate-700 pb-2">Simulation Control</h4>
             
             <div className="space-y-3">
               <button 
                 onClick={() => runBlock(false)}
                 disabled={blockStatus === 'mining'}
                 className="w-full py-4 bg-emerald-900/30 hover:bg-emerald-900/50 rounded-lg font-bold text-emerald-400 border border-emerald-800/50 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
               >
                 <CheckCircle2 className="w-5 h-5" />
                 Valid Transaction
               </button>
               <button 
                 onClick={() => runBlock(true)}
                 disabled={blockStatus === 'mining'}
                 className="w-full py-4 bg-rose-900/30 hover:bg-rose-900/50 rounded-lg font-bold text-rose-400 border border-rose-800/50 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
               >
                 <RefreshCcw className="w-5 h-5" />
                 Fail & Revert (Flashback)
               </button>
             </div>

             <div className="mt-6 text-sm text-slate-400 leading-relaxed bg-slate-900 p-4 rounded-lg">
                <p className="font-bold text-slate-300 mb-2">Watch the block on the right:</p>
                <ul className="list-disc list-inside space-y-1">
                   <li>Alice & Bob will always succeed.</li>
                   <li>If <strong>YOU</strong> fail, your "1M Loan" disappears as if it never happened.</li>
                   <li>Other people don't lose their data.</li>
                </ul>
             </div>
          </div>
        </div>

        {/* Visualizer */}
        <div className="lg:col-span-8 bg-black/40 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col p-6">
           <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
              <Box className="w-32 h-32" />
           </div>

           <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-300 flex items-center gap-2">
                 <Box className="w-4 h-4 text-blue-500" /> Current Block #192482
              </h4>
              <span className={`text-xs font-mono px-2 py-1 rounded ${blockStatus === 'mining' ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                 STATUS: {blockStatus.toUpperCase()}
              </span>
           </div>

           <div className="space-y-4 relative z-10">
              {txStates.map((tx) => (
                 <div 
                   key={tx.id} 
                   className={`relative overflow-hidden rounded-lg border transition-all duration-500 p-4 flex items-center justify-between
                     ${tx.status === 'idle' ? 'bg-slate-900 border-slate-800' : ''}
                     ${tx.status === 'pending' || tx.status === 'processing' ? 'bg-blue-900/20 border-blue-500/30' : ''}
                     ${tx.status === 'success' ? 'bg-emerald-900/20 border-emerald-500/30' : ''}
                     ${tx.status === 'reverting' ? 'bg-orange-900/20 border-orange-500 animate-shake' : ''}
                     ${tx.status === 'reverted' ? 'bg-slate-800/50 border-slate-700 opacity-50 grayscale' : ''}
                   `}
                 >
                    {/* Progress Bar Background */}
                    <div 
                       className={`absolute left-0 top-0 bottom-0 bg-current opacity-5 transition-all duration-1000 ease-linear
                          ${tx.status === 'success' ? 'w-full text-emerald-500' : 'w-0'}
                       `} 
                    />

                    <div className="flex items-center gap-4 z-10 min-w-[150px]">
                       <div className={`p-2 rounded-full ${tx.user === 'YOU' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                          <User className="w-5 h-5" />
                       </div>
                       <div>
                          <div className={`font-bold ${tx.user === 'YOU' ? 'text-purple-400' : 'text-slate-300'}`}>{tx.user}</div>
                          <div className="text-xs text-slate-500">{tx.action}</div>
                       </div>
                    </div>

                    {/* Balance Simulation */}
                    <div className="font-mono text-right z-10">
                       <div className="text-xs text-slate-500 uppercase">State (Balance)</div>
                       <div className={`font-bold transition-all ${tx.status === 'reverting' ? 'text-orange-500' : 'text-slate-200'}`}>
                          {tx.status === 'reverting' ? 'REWINDING...' : `$${tx.balance.toLocaleString()}`}
                       </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="w-24 flex justify-end z-10">
                       {tx.status === 'idle' && <Clock className="w-5 h-5 text-slate-600" />}
                       {(tx.status === 'pending' || tx.status === 'processing') && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                       {tx.status === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                       {tx.status === 'reverting' && <RefreshCcw className="w-6 h-6 text-orange-500 animate-spin-reverse" />}
                       {tx.status === 'reverted' && <span className="text-xs font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">REVERTED</span>}
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// 2. Call Stack Slide (The "How")
const CallStackSlide = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
       setStep(prev => (prev + 1) % 6);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const stackItems = [
    { id: 1, name: "Transaction (Attacker EOA)", depth: 0, active: step >= 0 },
    { id: 2, name: "FlashExploit.attack()", depth: 1, active: step >= 1 },
    { id: 3, name: "LendingPool.flashLoan()", depth: 2, active: step >= 2 },
    { id: 4, name: "FlashExploit.executeOperation()", depth: 3, active: step >= 3 },
    { id: 5, name: "DEX.swap() / Pool.borrow()", depth: 4, active: step >= 4 },
    { id: 6, name: "LendingPool.repay()", depth: 3, active: step >= 5 },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">The "How": Execution Stack</h3>
        <p className="text-slate-400">
          How does the loan, the swap, the borrow, and the repayment happen in <strong>one click</strong>?
          In DeFi, contracts call other contracts. The Flash Loan is just a function that pauses midway to let you do whatever you want, as long as you pay it back before it finishes.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
         {/* Diagram */}
         <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 h-full flex items-center justify-center">
            <div className="w-full max-w-sm space-y-2">
               {stackItems.map((item) => (
                 <div 
                   key={item.id}
                   className={`
                     transition-all duration-500 border rounded p-3 font-mono text-sm flex items-center gap-3
                     ${item.active 
                        ? 'translate-x-0 opacity-100 bg-slate-800 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'translate-x-4 opacity-20 bg-transparent border-slate-800 text-slate-600'}
                   `}
                   style={{ marginLeft: `${item.depth * 24}px` }}
                 >
                   <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
                      {item.depth}
                   </div>
                   {item.name}
                 </div>
               ))}
            </div>
         </div>

         {/* Explanation */}
         <div className="space-y-6">
            <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-xl">
               <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                 <Layers className="w-4 h-4" /> The "Callback" Magic
               </h4>
               <p className="text-sm text-slate-300 leading-relaxed">
                 Notice Step 3 and 4. The <code>LendingPool</code> doesn't just give you money and say "bye". 
                 It calls a special function in <strong>your</strong> contract (<code>executeOperation</code>).
                 <br/><br/>
                 The Pool waits for your function to finish. Once your function is done (Step 6), the Pool wakes up again to check its balance. 
                 If the money isn't there, it reverts everything.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

// 3. Comparison Slide (Interactive)
const ComparisonSlide = () => {
  const [activeTab, setActiveTab] = useState<'identity' | 'tx' | 'money'>('identity');

  const content = {
    identity: {
      title: "Identity & Trust",
      icon: <Fingerprint className="w-6 h-6 text-purple-400" />,
      web2: {
        label: "Session ID (Cookie)",
        code: `// Server checks session cookie
if (req.session.userId) {
  // Trust the server's memory
  grantAccess();
}
// Risk: Session Hijacking,
// Server Admin access`,
        note: "Identity is granted by the server. The admin can impersonate you or delete you."
      },
      web3: {
        label: "Private Key Signature",
        code: `// Cryptographic Proof
// msg.sender is guaranteed by math
require(msg.sender == owner);

// No one, not even the dev,
// can fake this.`,
        note: "Identity is mathematical. The smart contract cannot be fooled, and 'admins' cannot forge signatures."
      }
    },
    tx: {
      title: "Transactions & Atomicity",
      icon: <RefreshCcw className="w-6 h-6 text-blue-400" />,
      web2: {
        label: "Manual Management",
        code: `await db.startTransaction();
try {
  chargeUser();
  shipProduct(); // If this fails...
  await db.commit();
} catch (e) {
  // You MUST write this manually:
  await db.rollback(); 
}`,
        note: "If the dev forgets the 'catch' block, the money is gone but the product never ships. Inconsistent state is common."
      },
      web3: {
        label: "Atomic Execution",
        code: `function trade() external {
  // 1. Take Token A
  tokenA.transferFrom(msg.sender...);
  
  // 2. Send Token B
  // If this line fails (e.g. out of gas)
  tokenB.transfer(msg.sender...);
}`,
        note: "If ANY line fails, the entire transaction reverts automatically. It's all or nothing. No 'partial' broken states."
      }
    },
    money: {
      title: "Money & Assets",
      icon: <Banknote className="w-6 h-6 text-emerald-400" />,
      web2: {
        label: "Database Entry",
        code: `UPDATE users 
SET balance = balance + 100 
WHERE id = 1;

// It's just a number in a row.
// The bank can edit it directly.`,
        note: "Money is just data. It exists because the database administrator says it exists."
      },
      web3: {
        label: "Programmable Token",
        code: `contract ERC20 {
  mapping(address => uint) balanceOf;
  
  function transfer(to, amount) {
     balanceOf[msg.sender] -= amount;
     balanceOf[to] += amount;
  }
}`,
        note: "Money is logic. Tokens live in a shared contract standard. You don't 'hold' Bitcoin; you hold the key to move it."
      }
    }
  };

  const activeContent = content[activeTab];

  return (
    <div className="flex flex-col h-full">
       <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
             <Globe className="w-8 h-8 text-blue-500" />
             Web2 vs. Web3 Mindset
          </h3>
          <p className="text-slate-400">
             To understand Flash Loans, you must understand the environment they live in. 
             It's not just "Servers" vs "Blockchains"—it's a shift from <strong>Authority</strong> to <strong>Verification</strong>.
          </p>
       </div>

       {/* Tabs */}
       <div className="flex gap-2 mb-6 border-b border-slate-800 pb-1">
          {(Object.keys(content) as Array<keyof typeof content>).map((key) => (
             <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                   flex items-center gap-2 px-4 py-3 rounded-t-lg font-bold text-sm transition-all
                   ${activeTab === key 
                      ? 'bg-slate-800 text-white border-b-2 border-blue-500' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}
                `}
             >
                {content[key].icon}
                {content[key].title}
             </button>
          ))}
       </div>

       {/* Comparison Area */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
          
          {/* Web2 Side */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider">
                <Server className="w-4 h-4" /> The Old Way (Web2)
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col hover:border-slate-700 transition-colors group">
                <div className="bg-slate-950/50 px-4 py-3 border-b border-slate-800 font-mono text-sm text-blue-200">
                   {activeContent.web2.label}
                </div>
                <div className="p-4 bg-[#0d1117] overflow-x-auto flex-1">
                   <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {activeContent.web2.code}
                   </pre>
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-800 text-sm text-slate-400 italic">
                   "{activeContent.web2.note}"
                </div>
             </div>
          </div>

          {/* Web3 Side */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-2 text-emerald-400 uppercase text-xs font-bold tracking-wider">
                <Box className="w-4 h-4" /> The New Way (Web3)
             </div>
             <div className="bg-slate-900 border border-emerald-900/30 rounded-xl overflow-hidden flex-1 flex flex-col hover:border-emerald-500/30 transition-colors shadow-lg shadow-emerald-900/10">
                <div className="bg-emerald-950/30 px-4 py-3 border-b border-emerald-900/30 font-mono text-sm text-emerald-200">
                   {activeContent.web3.label}
                </div>
                <div className="p-4 bg-[#0d1117] overflow-x-auto flex-1 relative">
                   {/* Badge */}
                   <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                      ON-CHAIN
                   </div>
                   <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {activeContent.web3.code}
                   </pre>
                </div>
                <div className="p-4 bg-slate-900 border-t border-slate-800 text-sm text-slate-400 italic">
                   "{activeContent.web3.note}"
                </div>
             </div>
          </div>

       </div>
    </div>
  );
};


const slides = [
  { component: AtomicitySlide },
  { component: CallStackSlide },
  { component: ComparisonSlide },
];

const EducationSlideover: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const CurrentSlide = slides[currentIndex].component;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-6xl h-[85vh] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider">Deep Dive</span>
              DeFi Architecture Guide
            </h2>
            <p className="text-slate-500 text-xs mt-1">Module {currentIndex + 1} of {slides.length}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
           <CurrentSlide />
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
          <button 
            onClick={prevSlide}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-semibold border border-transparent hover:border-slate-700"
          >
            <ChevronLeft className="w-5 h-5" /> Previous Module
          </button>
          
          <div className="flex gap-3">
            {slides.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-blue-500 w-8' : 'bg-slate-700 w-2 hover:bg-slate-600'}`}
              />
            ))}
          </div>

          <button 
            onClick={nextSlide}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] border border-blue-500/50"
          >
             Next Module <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default EducationSlideover;