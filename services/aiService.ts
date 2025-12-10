
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean;
};

export const generateRemedialSuggestions = async (problemStatement: string, evidence: string): Promise<string[]> => {
  try {
    const prompt = `
      You are a Quality Assurance expert.
      Context: A Non-Conformance was found: "${problemStatement}".
      Evidence: "${evidence}".
      
      Task: List 3 to 5 specific, immediate "Remedial Actions" (Correction) to fix this specific instance right now.
      Do not provide long-term prevention steps yet, just immediate fixes.
      
      Output format: A raw JSON array of strings. Example: ["Fix the broken lock", "Dispose of contaminated product"]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("Error generating remedial suggestions:", error);
    return [];
  }
};

export const generateCorrectiveSuggestions = async (rootCauses: string[], problemStatement: string): Promise<string[]> => {
  try {
    if (rootCauses.length === 0) return [];

    const prompt = `
      You are a Quality Assurance expert.
      Problem: "${problemStatement}".
      Identified Root Causes:
      ${rootCauses.map(rc => `- ${rc}`).join('\n')}
      
      Task: List 3 to 5 specific "Corrective Actions" to eliminate these root causes and prevent recurrence.
      These should be actionable steps (e.g., "Revise SOP...", "Conduct training...", "Install sensor...").
      
      Output format: A raw JSON array of strings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("Error generating corrective suggestions:", error);
    return [];
  }
};

// Generates chains of "Whys"
export const generateRCAChains = async (problemStatement: string): Promise<string[][]> => {
  try {
    const prompt = `
      You are a Quality Assurance expert conducting a Root Cause Analysis using the 5 Whys technique.
      Problem Statement: "${problemStatement}"
      
      Task: Identify potential root causes by generating 3 to 4 distinct "Why Chains".
      Each chain must consist of 2 to 5 levels of "Why" (drill-down factors), starting from a symptom down to a root cause.
      
      Output format: A raw JSON ARRAY of string ARRAYS.
      
      Example:
      [
         ["Staff made an error", "Fatigue", "Double shift due to shortage"],
         ["Machine stopped", "Fuse blew", "Power surge", "No surge protector installed"]
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(cleanJsonString(text));
    
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error generating RCA chains:", error);
    return [];
  }
};

// Classifies chains into 4M categories
export const categorizeRCAChains = async (chains: {id: string, whys: string[]}[]): Promise<Record<string, string>> => {
  try {
    if (chains.length === 0) return {};

    const prompt = `
      You are a Quality Assurance expert categorizing Root Cause Analysis data for a Fishbone Diagram.
      
      Categories:
      - PEOPLE
      - METHODS
      - EQUIPMENT
      - ENVIRONMENT
      
      I will provide a list of Causal Chains (ID and Factors). 
      For each chain, analyze the factors and assign the most appropriate Category.
      
      Input Data:
      ${JSON.stringify(chains.map(c => ({ id: c.id, chain: c.whys.join(' -> ') })))}
      
      Output format: A raw JSON object where Keys are the "id" and Values are the "Category".
      Example: { "chain-1": "PEOPLE", "chain-2": "EQUIPMENT" }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "{}";
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error("Error categorizing chains:", error);
    // Return empty if fail, logic will handle defaults
    return {};
  }
};
