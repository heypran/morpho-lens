
export interface MarketAllocation {
  id: string;
  collateralAsset: string;
  collateralSymbol: string;
  collateralDecimals: number;
  loanAsset: string; // This is usually the vault asset
  lltv: number; // scaled 0-1 (e.g., 0.9 for 90%)
  marketLTV: number | null; // Current Market LTV (Debt/Collateral). Null if not derivable on-chain.
  healthFactor: number | null; // Market Health Factor. Null if not derivable.
  suppliedAssets: string;
  suppliedAssetsRaw: bigint;
  allocation: number; // 0-1 percentage of vault TVL
  marketUtilization: number; // 0-1
}

export interface VaultData {
  address: string;
  name: string;
  symbol: string;
  version: string; // MetaMorpho Version
  asset: string;
  assetSymbol: string;
  decimals: number; // Asset decimals
  vaultDecimals: number; // Share token decimals
  totalAssets: string; // formatted string
  totalAssetsRaw: bigint;
  totalSupply: string; // formatted string
  sharePrice: string;
  curator: string;
  timelock: number;
  pendingTimelock?: number;
  guardian?: string;
  fee?: number;
  
  // New Risk Metrics
  allocations: MarketAllocation[];
  weightedLLTV: number; // Weighted average of underlying markets
  weightedLTV?: number; // Weighted average of Current LTV (derived off-chain)
  weightedHealthFactor?: number | null; // Derived from Weighted LLTV / Weighted LTV
  
  idleLiquidity: string; // Total Available Liquidity (Cash + Withdrawable from Markets)
  idleLiquidityRaw: bigint;

  vaultCash: string; // Actual raw cash sitting in vault (balanceOf)
  vaultCashRaw: bigint;
}

export interface RiskMetrics {
  lltv: number; // Liquidation Loan To Value (avg or max)
  utilization: number; // Percentage
  liquidity: string; // Available cash in vault
  riskScore: number; // 1-100
  concentration: 'High' | 'Medium' | 'Low';
  warnings: string[];
}

export interface AnalysisResult {
  summary: string;
  riskFactors: string[];
  verdict: 'Safe' | 'Moderate' | 'High Risk' | 'Degen';
}

export enum FetchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}