
import React from 'react';
import { MarketAllocation } from '../types';
import { PieChart, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';

interface AllocationListProps {
  allocations: MarketAllocation[];
  assetSymbol: string;
  vaultCash: string;
}

const AllocationList: React.FC<AllocationListProps> = ({ allocations, assetSymbol, vaultCash }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="p-2 rounded-lg bg-morpho-500/10 text-morpho-400">
             <PieChart className="w-5 h-5" />
           </div>
           <h3 className="text-lg font-bold text-white">Underlying Asset Exposure</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">Sorted by Allocation</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/50 text-slate-400 font-medium uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Market (Collateral)</th>
              <th className="px-6 py-4 text-right">Max LTV (LLTV)</th>
              <th className="px-6 py-4 text-right group relative cursor-help">
                 <span className="border-b border-dotted border-slate-600">Current LTV</span>
              </th>
              <th className="px-6 py-4 text-right group relative cursor-help">
                  <span className="border-b border-dotted border-slate-600">Health Factor</span>
              </th>
              <th className="px-6 py-4 text-right">Utilization</th>
              <th className="px-6 py-4 text-right">Amount Supplied</th>
              <th className="px-6 py-4 text-right">Allocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {allocations.map((market) => (
              <tr key={market.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{market.collateralSymbol}</span>
                    <span className="text-xs text-slate-500 font-mono truncate max-w-[100px]">{market.id.slice(0, 6)}...{market.id.slice(-4)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-orange-300">
                  {(market.lltv * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-300">
                   {market.marketLTV !== null ? (
                     <span className={market.marketLTV > 0.9 ? "text-red-400" : "text-slate-300"}>
                       {(market.marketLTV * 100).toFixed(2)}%
                     </span>
                   ) : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                   {market.healthFactor !== null ? (
                     <span className={market.healthFactor < 1.05 ? "text-red-400 font-bold" : "text-green-400"}>
                       {market.healthFactor.toFixed(2)}
                     </span>
                   ) : 'N/A'}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  <div className="flex items-center justify-end gap-2">
                     <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${market.marketUtilization > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${market.marketUtilization * 100}%` }}
                        ></div>
                     </div>
                     <span className={market.marketUtilization > 0.9 ? 'text-red-400' : 'text-slate-300'}>
                        {(market.marketUtilization * 100).toFixed(1)}%
                     </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-300">
                   {Number(market.suppliedAssets).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">{assetSymbol}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className="font-bold text-white">{(market.allocation * 100).toFixed(2)}%</span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-morpho-500 rounded-full" style={{ width: `${market.allocation * 100}%` }}></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {Number(vaultCash) > 0.000001 && (
                 <tr className="bg-slate-900/50">
                 <td className="px-6 py-4">
                   <div className="flex items-center gap-2">
                     <span className="font-bold text-slate-400">Unallocated Cash</span>
                     <AlertCircle className="w-3 h-3 text-slate-500" />
                   </div>
                 </td>
                 <td className="px-6 py-4 text-right font-mono text-slate-500">-</td>
                 <td className="px-6 py-4 text-right font-mono text-slate-500">-</td>
                 <td className="px-6 py-4 text-right font-mono text-slate-500">-</td>
                 <td className="px-6 py-4 text-right font-mono text-slate-500">-</td>
                 <td className="px-6 py-4 text-right font-mono text-slate-400">
                    {Number(vaultCash).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs text-slate-500">{assetSymbol}</span>
                 </td>
                 <td className="px-6 py-4 text-right">
                    <span className="text-slate-500 italic">Idle</span>
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-start gap-3 text-xs text-slate-500">
        <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-400">Data Sources:</strong> Vault TVL and Share Price are verified directly on-chain. 
          <strong className="text-slate-400 ml-1">Current Market LTV</strong> and <strong className="text-slate-400">Health Factors</strong> are derived using <a href="https://docs.morpho.org/build/borrow/tutorials/get-data" target="_blank" rel="noreferrer" className="text-morpho-400 hover:underline flex inline-flex items-center gap-1">Morpho Blue API <ExternalLink className="w-3 h-3"/></a> to fetch total market collateral and oracle prices.
        </p>
      </div>
    </div>
  );
};

export default AllocationList;
