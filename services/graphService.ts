
import { MarketAllocation, ChainId } from '../types';

const MORPHO_GRAPH_URL = 'https://blue-api.morpho.org/graphql';

interface GraphMarketState {
  borrowAssetsUsd: number;
  collateralAssetsUsd: number;
}

interface GraphMarketItem {
  uniqueKey: string;
  state: GraphMarketState | null;
}

interface GraphResponse {
  data?: {
    markets?: {
      items: GraphMarketItem[];
    };
  };
  errors?: any[];
}

/**
 * Enriches the on-chain allocation data with off-chain market metrics (LTV, Health Factor)
 * fetched from the Morpho Blue GraphQL API using USD values.
 */
export const enrichVaultDataWithGraph = async (allocations: MarketAllocation[], chainId: ChainId): Promise<MarketAllocation[]> => {
  if (allocations.length === 0) return allocations;

  try {
    // 1. Prepare IDs: Force lowercase and wrap in quotes
    const ids = allocations.map(a => `"${a.id.toLowerCase()}"`).join(',');
    
    // 2. Construct Query with Chain ID
    // Fetching USD values directly from the API to simplify calculation
    // WE MUST QUERY `uniqueKey` to match the on-chain ID, not `id`.
    const query = `
      query {
        markets(where: { chainId_in: [${chainId}],  uniqueKey_in: [${ids}] }) {
          items {
            uniqueKey
            state {
              borrowAssetsUsd
              collateralAssetsUsd
            }
          }
        }
      }
    `;

    console.log("Fetching Morpho Graph Data (USD metrics)...", { count: allocations.length });

    const response = await fetch(MORPHO_GRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const result = await response.json() as GraphResponse;
    
    if (result.errors) {
      console.error("Graph API Errors:", result.errors);
      return allocations;
    }

    const items = result.data?.markets?.items || [];
    console.log(`Graph Fetch Success: Received ${items.length} items`);

    const marketMap = new Map<string, GraphMarketItem>();
    items.forEach(item => {
      // Map using uniqueKey as that matches our on-chain ID
      if (item.uniqueKey) {
        marketMap.set(item.uniqueKey.toLowerCase(), item);
      }
    });

    // 3. Merge Data
    return allocations.map(alloc => {
      const graphData = marketMap.get(alloc.id.toLowerCase());

      // If data is missing or state is null, return original "N/A" state
      if (!graphData || !graphData.state) {
        return alloc;
      }

      try {
        const borrowUsd = graphData.state.borrowAssetsUsd || 0;
        const collateralUsd = graphData.state.collateralAssetsUsd || 0;

        let marketLTV: number | null = null;
        let healthFactor: number | null = null;

        // LTV Calculation: Total Debt (USD) / Total Collateral (USD)
        if (collateralUsd > 0) {
          marketLTV = borrowUsd / collateralUsd;

          // Health Factor: LLTV / Current LTV
          if (marketLTV > 0) {
            healthFactor = alloc.lltv / marketLTV;
          } else {
             // If LTV is 0 (no debt), Health Factor is conceptually infinite. 
             // We cap it at 100 or null to indicate 'Safe'.
            healthFactor = 100; 
          }
        } else {
          // No collateral
          if (borrowUsd > 0) {
             // Debt but no collateral = Bad Debt / Liquidatable
             marketLTV = Infinity;
             healthFactor = 0;
          } else {
             // No debt, no collateral = Empty market
             marketLTV = 0;
             healthFactor = 100;
          }
        }

        return {
          ...alloc,
          marketLTV,
          healthFactor
        };
      } catch (err) {
        console.warn(`Error calculating metrics for market ${alloc.id}`, err);
        return alloc;
      }
    });

  } catch (error) {
    console.error("Failed to fetch off-chain market data:", error);
    return allocations;
  }
};
