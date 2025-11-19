import { GoogleGenAI, Type } from "@google/genai";
import { VaultData, AnalysisResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVaultRisk = async (data: VaultData): Promise<AnalysisResult> => {
  try {
    const model = "gemini-2.5-flash";
    
    const prompt = `
      Act as a Senior DeFi Risk Auditor. Analyze the following MetaMorpho Vault data on Ethereum Mainnet.
      
      Vault Name: ${data.name} (${data.symbol})
      Asset: ${data.assetSymbol}
      Total Assets (TVL): ${data.totalAssets} ${data.assetSymbol}
      Curator Address: ${data.curator}
      Timelock: ${data.timelock} seconds
      Share Price: ${data.sharePrice}
      
      Provide a structured risk assessment. 
      1. Summarize the vault's purpose based on its name and symbol (e.g., "Steakhouse USDC" implies RWA/Treasury focus).
      2. List potential risk factors (e.g., centralized curator, low timelock, small TVL, smart contract risk).
      3. Give a final verdict: "Safe", "Moderate", "High Risk", or "Degen".
      
      Output JSON format matching this schema:
      {
        "summary": "string",
        "riskFactors": ["string", "string"],
        "verdict": "Safe" | "Moderate" | "High Risk" | "Degen"
      }
    `;

    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            riskFactors: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            verdict: { type: Type.STRING }
          },
          required: ["summary", "riskFactors", "verdict"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "AI analysis unavailable at this time.",
      riskFactors: ["Could not connect to AI service"],
      verdict: "Moderate"
    };
  }
};