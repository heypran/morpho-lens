
import React, { useState } from 'react';
import { Layers,  InfoIcon, Wallet, DollarSign, Activity, Lock, Percent, BarChart3, HeartPulse, TrendingUp } from 'lucide-react';
import VaultInput from './components/VaultInput';
import MetricsCard from './components/MetricsCard';
// import AIAnalysis from './components/AIAnalysis';
import AllocationList from './components/AllocationList';
import { fetchVaultOnChain } from './services/chainService';
import { analyzeVaultRisk } from './services/geminiService';
import { enrichVaultDataWithGraph } from './services/graphService';
import { VaultData, AnalysisResult, FetchStatus } from './types';

function App() {
  const [status, setStatus] = useState<FetchStatus>(FetchStatus.IDLE);
  const [data, setData] = useState<VaultData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (address: string) => {
    setStatus(FetchStatus.LOADING);
    setError(null);
    setAnalysis(null);
    setData(null);

    try {
      // 1. Fetch On-Chain Data
      let vaultData = await fetchVaultOnChain(address);

      // 2. Enrich with Off-Chain Graph Data (Market LTV, Health Factor)
      try {
         const enrichedAllocations = await enrichVaultDataWithGraph(vaultData.allocations);
         
         // Calculate Weighted Metrics based on enriched data
         let weightedCurrentLTV = 0;
         
         enrichedAllocations.forEach(alloc => {
             // Idle liquidity has 0 LTV. Markets with null LTV (fetch error) treated as 0 for safety.
             const ltv = alloc.marketLTV || 0;
             weightedCurrentLTV += alloc.allocation * ltv;
         });

         // Weighted Health Factor = Weighted Max LTV (LLTV) / Weighted Current LTV
         // If Current LTV is 0 (all cash), Health Factor is conceptually Infinite.
         let weightedHealthFactor = null;
         if (weightedCurrentLTV > 0) {
             weightedHealthFactor = vaultData.weightedLLTV / weightedCurrentLTV;
         } else if (vaultData.weightedLLTV > 0) {
             // Non-zero Max LTV but 0 Current LTV = Infinite Safety
             weightedHealthFactor = 100; // Cap for display
         }

         vaultData = {
            ...vaultData,
            allocations: enrichedAllocations,
            weightedLTV: weightedCurrentLTV,
            weightedHealthFactor: weightedHealthFactor
         };
      } catch (graphErr) {
         console.warn("Graph enrichment failed, proceeding with on-chain data only", graphErr);
      }

      setData(vaultData);

      // 3. Analyze with Gemini
      const aiResult = await analyzeVaultRisk(vaultData);
      setAnalysis(aiResult);
      
      setStatus(FetchStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
      setStatus(FetchStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-morpho-500/30">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-8 h-8 text-morpho-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              MorphoLens
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-400">Mainnet</span>
            <a href="https://x.com/heypran" target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-white transition"> built by <span className="text-morpho-400">heypran</span></a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Know your <span className="text-morpho-400">yield</span> risk
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Understand your exposure across <span className="text-morpho-400">Morpho</span> vaults.
          </p>
        </div>

        {/* Input Section */}
        <VaultInput onAnalyze={handleAnalyze} status={status} />

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <InfoIcon className="w-6 h-6" />
            <span>{`${error} Sometimes RPC is slow, you may try again.`}</span>
            
          </div>
        )}

        {/* Dashboard Grid */}
        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="text-slate-400 text-sm mb-1">Vault Name</div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  {data.name}
                  <span className="text-base font-normal text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {data.symbol}
                  </span>
                  {data.version && (
                    <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono">
                      v{data.version}
                    </span>
                  )}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-sm mb-1">Underlying Asset</div>
                <div className="text-xl font-mono text-morpho-300">{data.assetSymbol}</div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricsCard 
                title="Total Assets (TVL)" 
                value={`${Number(data.totalAssets).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                subValue={data.assetSymbol}
                icon={Wallet}
                color="blue"
              />
              <MetricsCard 
                title="Share Price" 
                value={data.sharePrice}
                subValue={`1 ${data.symbol} = ${Number(data.sharePrice).toFixed(4)} ${data.assetSymbol}`}
                icon={DollarSign}
                color="green"
              />
              <MetricsCard 
                title="Available Liquidity" 
                value={`${Number(data.idleLiquidity).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
                subValue={`${data.assetSymbol} (Cash + Markets)`}
                icon={BarChart3}
                color="orange"
              />
               <MetricsCard
                title="Weighted Max LTV"
                value={`${(data.weightedLLTV * 100).toFixed(2)}%`}
                subValue="Portfolio Limit (LLTV)"
                icon={Percent}
                color="purple"
                infoContent={{
                  description: "Maximum Loan-to-Value ratio across all markets, weighted by allocation size. This represents the theoretical maximum leverage the vault can achieve.",
                  calculation: "Σ (Market Allocation × Market LLTV) / Total Allocation",
                  example: "If 50% in Market A (90% LLTV) and 50% in Market B (80% LLTV), then Weighted Max LTV = (0.5 × 0.9) + (0.5 × 0.8) = 85%"
                }}
              />
              <MetricsCard
                title="Weighted Current LTV"
                value={data.weightedLTV ? `${(data.weightedLTV * 100).toFixed(2)}%` : '0.00%'}
                subValue="Portfolio Debt/Collateral"
                icon={TrendingUp}
                color="blue"
                infoContent={{
                  description: "Current Loan-to-Value ratio across all markets, weighted by allocation. This shows how much of the vault's borrowing capacity is actually being used.",
                  calculation: "Σ (Market Allocation × Market Current LTV) / Total Allocation",
                  example: "If 50% in Market A (45% current LTV) and 50% in Market B (30% current LTV), then Weighted Current LTV = (0.5 × 0.45) + (0.5 × 0.30) = 37.5%"
                }}
              />
              <MetricsCard
                title="Portfolio Health Factor"
                value={data.weightedHealthFactor && data.weightedHealthFactor < 99 ? data.weightedHealthFactor.toFixed(2) : '> 100'}
                subValue="Max LTV / Current LTV"
                icon={HeartPulse}
                color={data.weightedHealthFactor && data.weightedHealthFactor < 1.1 ? "orange" : "green"}
                infoContent={{
                  description: "Ratio of maximum borrowing capacity to current borrowing. A higher value indicates safer position with more room before liquidation.",
                  calculation: "Weighted Max LTV / Weighted Current LTV",
                  example: "If Max LTV is 85% and Current LTV is 40%, then Health Factor = 0.85 / 0.40 = 2.125. Values below 1.0 indicate potential liquidation risk."
                }}
              />
            </div>

            {/* Allocation & Risk Section */}
            <div className="grid grid-cols-1 gap-8">
                {/* Underlying Markets */}
                <AllocationList 
                    allocations={data.allocations} 
                    assetSymbol={data.assetSymbol}
                    vaultCash={data.vaultCash}
                />
            </div>

            {/* Deep Dive Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: AI Analysis */}
              {/* <div className="lg:col-span-2">
                 <h3 className="text-xl font-bold text-white mb-4">AI Risk Assessment</h3>
                 <AIAnalysis analysis={analysis} loading={status === FetchStatus.LOADING} />
              </div> */}

              {/* Right Column: Contract Details */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-bold text-white mb-4">Verifiable Parameters</h3>
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div>
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Curator Address</div>
                    <div className="font-mono text-sm text-morpho-300 break-all bg-slate-950 p-2 rounded border border-slate-800/50">
                      {data.curator}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Vault Contract</div>
                    <div className="font-mono text-sm text-slate-300 break-all bg-slate-950 p-2 rounded border border-slate-800/50">
                      {data.address}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Timelock</div>
                        <div className="font-mono text-sm text-white">{(data.timelock / 3600).toFixed(1)}h</div>
                    </div>
                     <div>
                        <div className="text-xs uppercase text-slate-500 font-semibold mb-1">Perf. Fee</div>
                        <div className="font-mono text-sm text-white">{data.fee ? `${(data.fee / 1e16).toFixed(2)}%` : '0%'}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                     <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Guardian</span>
                        <span className="text-white">{data.guardian === '0x0000000000000000000000000000000000000000' ? 'None' : 'Active'}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Markets Count</span>
                        <span className="text-white">{data.allocations.length}</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;
