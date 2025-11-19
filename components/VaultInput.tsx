import React, { useState } from 'react';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { FetchStatus } from '../types';

interface VaultInputProps {
  onAnalyze: (address: string) => void;
  status: FetchStatus;
}

const VaultInput: React.FC<VaultInputProps> = ({ onAnalyze, status }) => {
  const [input, setInput] = useState('');
  // Default to a popular vault (Steakhouse USDC) for demo purposes
  const placeholder = "0xBEEF01735c132Bec6bdc038e9316E95266525c38"; 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAnalyze(input.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-morpho-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-800 shadow-2xl p-2">
          <Search className="ml-4 text-slate-400 w-6 h-6" />
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
      </div>
    </div>
  );
};

export default VaultInput;