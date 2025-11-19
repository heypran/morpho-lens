import {
  createPublicClient,
  http,
  parseAbi,
  formatUnits,
  getContract,
  Address,
} from "viem";
import { mainnet } from "viem/chains";
import { VaultData, MarketAllocation } from "../types";

// Initialize Viem Public Client
const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL ?? "https://eth.llamarpc.com"),
  batch: {
    multicall: true,
  },
});

// --- Constants & ABIs ---
const MORPHO_BLUE_ADDRESS = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb";

const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
]);

const METAMORPHO_ABI = parseAbi([
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function convertToAssets(uint256) view returns (uint256)",
  "function curator() view returns (address)",
  "function timelock() view returns (uint256)",
  "function fee() view returns (uint256)",
  "function guardian() view returns (address)",
  "function supplyQueueLength() view returns (uint256)",
  "function supplyQueue(uint256) view returns (bytes32)",
  "function withdrawQueueLength() view returns (uint256)",
  "function withdrawQueue(uint256) view returns (bytes32)",
  "function version() view returns (string)",
]);

const MORPHO_BLUE_ABI = parseAbi([
  "function idToMarketParams(bytes32) view returns (address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)",
  "function market(bytes32) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)",
  "function position(bytes32, address) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)",
]);

export const isValidAddress = (addr: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
};

export const fetchVaultOnChain = async (
  address: string
): Promise<VaultData> => {
  if (!isValidAddress(address)) {
    throw new Error("Invalid Ethereum Address");
  }

  const vaultAddress = address as Address;
  // Cast to any to avoid TS inference issues with 'read' property
  const vaultContract = getContract({
    address: vaultAddress,
    abi: METAMORPHO_ABI,
    client: { public: client },
  } as any) as any;

  try {
    // 1. Fetch Basic Vault Data (Added version and queues)
    const [
      totalAssets,
      totalSupply,
      assetAddr,
      curator,
      timelock,
      guardian,
      fee,
      supplyQueueLen,
      withdrawQueueLen,
      version,
    ] = await Promise.all([
      vaultContract.read.totalAssets(),
      vaultContract.read.totalSupply(),
      vaultContract.read.asset(),
      vaultContract.read.curator(),
      vaultContract.read.timelock(),
      vaultContract.read
        .guardian()
        .catch(() => "0x0000000000000000000000000000000000000000"),
      vaultContract.read.fee().catch(() => 0n),
      vaultContract.read.supplyQueueLength(),
      vaultContract.read.withdrawQueueLength().catch(() => 0n),
      vaultContract.read.version().catch(() => "Unknown"),
    ]);

    // 2. Fetch Asset Details & Vault Cash (BalanceOf Vault)
    const assetContract = getContract({
      address: assetAddr,
      abi: ERC20_ABI,
      client: { public: client },
    } as any) as any;
    const [assetSymbol, assetDecimals, vaultCashRaw] = await Promise.all([
      assetContract.read.symbol(),
      assetContract.read.decimals(),
      assetContract.read.balanceOf([vaultAddress]),
    ]);

    // 3. Fetch Vault Token Details
    const vaultTokenContract = getContract({
      address: vaultAddress,
      abi: ERC20_ABI,
      client: { public: client },
    } as any) as any;
    const [vaultName, vaultSymbol, vaultDecimals] = await Promise.all([
      vaultTokenContract.read.name(),
      vaultTokenContract.read.symbol(),
      vaultTokenContract.read.decimals(),
    ]);

    // 4. Share Price Calculation
    let sharePrice = "1.0000";
    try {
      const oneShare = 10n ** BigInt(vaultDecimals);
      const assetsPerShare = await vaultContract.read.convertToAssets([
        oneShare,
      ]);
      sharePrice = formatUnits(assetsPerShare, assetDecimals);
    } catch (e) {
      console.warn(
        "Could not calculate share price via convertToAssets, falling back to division",
        e
      );
      if (totalSupply > 0n) {
        const price =
          Number(formatUnits(totalAssets, assetDecimals)) /
          Number(formatUnits(totalSupply, vaultDecimals));
        sharePrice = price.toFixed(4);
      }
    }

    // 5. Process Underlying Markets (Supply + Withdraw Queues)
    const marketAllocations: MarketAllocation[] = [];
    let weightedLLTVNumerator = 0n;
    let totalMarketAvailableLiquidity = 0n;

    // A. Fetch IDs from both queues
    const queueCalls = [];
    const supplyLen = Number(supplyQueueLen);
    const withdrawLen = Number(withdrawQueueLen);

    for (let i = 0; i < supplyLen; i++) {
      queueCalls.push({
        address: vaultAddress,
        abi: METAMORPHO_ABI,
        functionName: "supplyQueue",
        args: [BigInt(i)],
      });
    }
    for (let i = 0; i < withdrawLen; i++) {
      queueCalls.push({
        address: vaultAddress,
        abi: METAMORPHO_ABI,
        functionName: "withdrawQueue",
        args: [BigInt(i)],
      });
    }

    let allIds: `0x${string}`[] = [];
    const withdrawQueueSet = new Set<string>();

    if (queueCalls.length > 0) {
      const queueResults = await client.multicall({
        contracts: queueCalls,
        allowFailure: false,
      } as any);

      const supplyIds = queueResults.slice(0, supplyLen).map((r: any) => r);
      const withdrawIds = queueResults.slice(supplyLen).map((r: any) => r);

      withdrawIds.forEach((id: string) =>
        withdrawQueueSet.add(id.toLowerCase())
      );

      // Combine unique IDs
      allIds = Array.from(
        new Set([...supplyIds, ...withdrawIds])
      ) as `0x${string}`[];
    }

    if (allIds.length > 0) {
      // B. Fetch Market Data for all unique IDs
      const marketCalls = [];
      for (const id of allIds) {
        marketCalls.push(
          {
            address: MORPHO_BLUE_ADDRESS,
            abi: MORPHO_BLUE_ABI,
            functionName: "idToMarketParams",
            args: [id],
          },
          {
            address: MORPHO_BLUE_ADDRESS,
            abi: MORPHO_BLUE_ABI,
            functionName: "market",
            args: [id],
          },
          {
            address: MORPHO_BLUE_ADDRESS,
            abi: MORPHO_BLUE_ABI,
            functionName: "position",
            args: [id, vaultAddress],
          }
        );
      }

      const results = await client.multicall({
        contracts: marketCalls,
        allowFailure: false,
      } as any);

      // C. Gather unique collateral tokens
      const collateralTokens = new Set<Address>();
      const marketDataList = [];

      for (let i = 0; i < allIds.length; i++) {
        const baseIdx = i * 3;
        const params = results[baseIdx] as any;
        const marketState = results[baseIdx + 1] as any;
        const position = results[baseIdx + 2] as any;

        collateralTokens.add(params[1]);

        marketDataList.push({
          id: allIds[i],
          params,
          marketState,
          position,
        });
      }

      // D. Fetch Collateral Symbols/Decimals
      const uniqueCollaterals = Array.from(collateralTokens);
      const tokenCalls = [];
      for (const token of uniqueCollaterals) {
        tokenCalls.push(
          { address: token, abi: ERC20_ABI, functionName: "symbol" },
          { address: token, abi: ERC20_ABI, functionName: "decimals" }
        );
      }

      let tokenResults: any[] = [];
      if (uniqueCollaterals.length > 0) {
        const res = await client.multicall({
          contracts: tokenCalls,
          allowFailure: true,
        } as any);
        tokenResults = res as any[];
      }

      const tokenMap = new Map<string, { symbol: string; decimals: number }>();
      for (let i = 0; i < uniqueCollaterals.length; i++) {
        const symRes = tokenResults[i * 2];
        const decRes = tokenResults[i * 2 + 1];
        tokenMap.set(uniqueCollaterals[i].toLowerCase(), {
          symbol:
            symRes.status === "success" ? (symRes.result as string) : "???",
          decimals:
            decRes.status === "success" ? (decRes.result as number) : 18,
        });
      }

      // E. Process Data
      for (const m of marketDataList) {
        const supplyShares = BigInt(m.position[0]);

        // Even if supplyShares is 0, we might want to know the market exists if it's in queue,
        // but for allocation list we generally only care about non-zero positions or active queues.
        // Let's skip 0 positions for allocation chart, but if we wanted to show "Empty Queues" we could keep them.
        if (supplyShares === 0n) continue;

        const lltvRaw = BigInt(m.params[4]); // uint256
        const collateralToken = m.params[1];

        // Calculate Assets Supplied
        let suppliedAssets = 0n;
        const totalSupplyAssets = BigInt(m.marketState[0]);
        const totalSupplyShares = BigInt(m.marketState[1]);
        const totalBorrowAssets = BigInt(m.marketState[2]);

        if (totalSupplyShares > 0n) {
          suppliedAssets =
            (supplyShares * totalSupplyAssets) / totalSupplyShares;
        }

        weightedLLTVNumerator += suppliedAssets * lltvRaw;

        // Liquidity Calculation
        // Only count liquidity if market is in Withdraw Queue
        if (withdrawQueueSet.has(m.id.toLowerCase())) {
          // Available in market = Supply - Borrow
          const marketLiquidity =
            totalSupplyAssets > totalBorrowAssets
              ? totalSupplyAssets - totalBorrowAssets
              : 0n;

          // Vault can only withdraw what it owns or what is available
          const vaultAccessible =
            suppliedAssets < marketLiquidity ? suppliedAssets : marketLiquidity;
          totalMarketAvailableLiquidity += vaultAccessible;
        }

        const tokenInfo = tokenMap.get(collateralToken.toLowerCase()) || {
          symbol: "UNKNOWN",
          decimals: 18,
        };

        // Market Utilization
        const utilization =
          totalSupplyAssets > 0n
            ? Number(totalBorrowAssets) / Number(totalSupplyAssets)
            : 0;

        marketAllocations.push({
          id: m.id,
          collateralAsset: collateralToken,
          collateralSymbol: tokenInfo.symbol,
          collateralDecimals: tokenInfo.decimals,
          loanAsset: m.params[0],
          lltv: Number(formatUnits(lltvRaw, 18)),
          marketLTV: null,
          healthFactor: null,
          suppliedAssets: formatUnits(suppliedAssets, assetDecimals),
          suppliedAssetsRaw: suppliedAssets,
          allocation: 0,
          marketUtilization: utilization,
        });
      }
    }

    // 6. Derived Metrics

    marketAllocations.forEach((alloc) => {
      const allocNum = Number(
        formatUnits(alloc.suppliedAssetsRaw, assetDecimals)
      );
      const totalNum = Number(formatUnits(totalAssets, assetDecimals));
      alloc.allocation = totalNum > 0 ? allocNum / totalNum : 0;
    });

    marketAllocations.sort((a, b) => b.allocation - a.allocation);

    let weightedLLTV = 0;
    if (totalAssets > 0n) {
      const weightedRaw =
        Number(formatUnits(weightedLLTVNumerator, assetDecimals)) /
        Number(formatUnits(totalAssets, assetDecimals));
      weightedLLTV = weightedRaw / 1e18;
    }

    // Total Available Liquidity = Vault Cash + Accessible Market Liquidity
    const totalLiquidityRaw =
      (vaultCashRaw as bigint) + totalMarketAvailableLiquidity;

    return {
      address,
      name: vaultName,
      symbol: vaultSymbol,
      version: version as string,
      asset: assetAddr,
      assetSymbol,
      decimals: assetDecimals,
      vaultDecimals,
      totalAssets: formatUnits(totalAssets, assetDecimals),
      totalAssetsRaw: totalAssets,
      totalSupply: formatUnits(totalSupply, vaultDecimals),
      sharePrice,
      curator,
      timelock: Number(timelock),
      guardian: guardian as string,
      fee: Number(fee),
      allocations: marketAllocations,
      weightedLLTV,
      weightedLTV: 0,
      weightedHealthFactor: null,

      // Metrics Card shows TOTAL Available Liquidity
      idleLiquidity: formatUnits(totalLiquidityRaw, assetDecimals),
      idleLiquidityRaw: totalLiquidityRaw,

      // Allocation Table shows Unallocated Cash
      vaultCash: formatUnits(vaultCashRaw as bigint, assetDecimals),
      vaultCashRaw: vaultCashRaw as bigint,
    };
  } catch (error: any) {
    console.error("Blockchain Fetch Error Details:", error);
    let msg = "Failed to fetch vault data. Verify address and network.";
    if (error.message && error.message.includes("revert")) {
      msg =
        "Transaction reverted. The address might not be a valid MetaMorpho vault.";
    }
    throw new Error(msg);
  }
};
