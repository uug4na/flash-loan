import { GoogleGenAI } from "@google/genai";
import { SimulationStep } from "../types";

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      genAI = new GoogleGenAI({ apiKey });
    }
  }
  return genAI;
};

export const explainStep = async (step: SimulationStep, contextData: any): Promise<string> => {
  const ai = getGenAI();
  if (!ai) return "Gemini API Key not configured. Using static descriptions.";

  const stepNames = [
    "Initial State",
    "Flash Loan Execution",
    "Oracle Manipulation (Pump)",
    "Collateral Deposit",
    "Exploitative Borrowing",
    "Loan Repayment & Dump",
    "Profit Realization"
  ];

  const prompt = `
    You are a DeFi Security Expert explaining a Flash Loan Oracle Attack to a beginner.
    
    Current Step: ${stepNames[step]}
    Context Data: ${JSON.stringify(contextData)}
    
    Explain specifically what is happening in this step in 2-3 concise sentences. 
    Focus on the flow of money and why this step is critical to the attack.
    Do not use complex jargon without simplifying it.
    
    If Step is 0: Explain we are an attacker with 0 money looking for an opportunity.
    If Step is 1: Explain borrowing massive funds without collateral (Flash Loan).
    If Step is 2: Explain buying a huge amount of token to artificially pump the price on the DEX.
    If Step is 3: Explain depositing the pumped token into a Lending Protocol which trusts the DEX price.
    If Step is 4: Explain borrowing stablecoins against the falsely inflated collateral value.
    If Step is 5: Explain dumping the remaining tokens and repaying the flash loan.
    If Step is 6: Explain the net profit generated from nothing.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Could not fetch AI explanation.";
  }
};