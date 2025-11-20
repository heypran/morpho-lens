import React, { useState } from 'react';
import { Search, ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { FetchStatus, ChainId } from '../types';

interface VaultInputProps {
  onAnalyze: (address: string, chainId: ChainId) => void;
  status: FetchStatus;
  selectedChain: ChainId;
  onChainChange: (chain: ChainId) => void;
}

const CHAIN_OPTIONS = [
  { id: ChainId.MAINNET, label: 'Ethereum', icon: '🔷' },
  { id: ChainId.BASE, label: 'Base', icon: '🔵' },
  { id: ChainId.ARBITRUM, label: 'Arbitrum', icon: '💙' },
  { id: ChainId.OPTIMISM, label: 'Optimism', icon: '🔴' },
];

const VaultInput: React.FC<VaultInputProps> = ({ onAnalyze, status, selectedChain, onChainChange }) => {
  const [input, setInput] = useState('');
  // Default to a popular vault (Steakhouse USDC) for demo purposes
  const placeholder = "0xBEEF01735c132Bec6bdc038e9316E95266525c38"; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
    if (input.trim()) {
      onAnalyze(input.trim(), selectedChain);
    }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-morpho-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-2">
          
          {/* Chain Selector */}
          <div className="relative group/chain border-r border-slate-800 pr-2 mr-2">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span>{CHAIN_OPTIONS.find(c => c.id === selectedChain)?.icon}</span>
              <span className="font-medium hidden sm:block">{CHAIN_OPTIONS.find(c => c.id === selectedChain)?.label}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover/chain:opacity-100 group-hover/chain:visible transition-all z-50">
              {CHAIN_OPTIONS.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => onChainChange(chain.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800 transition-colors ${
                    selectedChain === chain.id ? 'bg-slate-800/50 text-white' : 'text-slate-400'
                  }`}
                >
                  <span>{chain.icon}</span>
                  <span className="font-medium">{chain.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Search className="text-slate-400 w-6 h-6" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Enter Vault Address (e.g., ${placeholder})`}
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 text-lg px-4 py-2 font-mono"
            disabled={status === FetchStatus.LOADING}
          />
          <button
            type="submit"
            disabled={status === FetchStatus.LOADING}
            className="bg-morpho-600 hover:bg-morpho-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === FetchStatus.LOADING ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Scanning</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
      <div className="mt-4 flex gap-3 justify-center text-sm text-slate-500">
       <span>Try:</span>
        <button onClick={() => setInput('0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB')} className="hover:text-morpho-400 underline decoration-dotted">Steakhouse USDC</button>
        <button onClick={() => setInput('0x4881Ef0BF6d2365D3dd6499ccd7532bcdBCE0658')} className="hover:text-morpho-400 underline decoration-dotted">Gauntlet WETH Core</button>
        <button onClick={() => setInput('0xBEeFFF209270748ddd194831b3fa287a5386f5bC')} className="hover:text-morpho-400 underline decoration-dotted">Smokehouse USDC</button>
      </div>
    </div>
  );
};

export default VaultInput;