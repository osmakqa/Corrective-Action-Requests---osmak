
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

export interface FourMFactors {
  PEOPLE: string[][];
  METHODS: string[][];
  EQUIPMENT: string[][];
  ENVIRONMENT: string[][];
}

export const generate4MFactors = async (problemStatement: string): Promise<FourMFactors> => {
  try {
    const prompt = `
      You are a Quality Assurance expert conducting a Root Cause Analysis (Fishbone/Ishikawa).
      Problem Statement: "${problemStatement}"
      
      Task: Identify potential contributing factors for the 4M categories.
      Categories:
      1. PEOPLE (Manpower)
      2. METHODS (Process/Procedures)
      3. EQUIPMENT (Machines/Tools)
      4. ENVIRONMENT (Material/Setting)

      For each category, provide 1 or 2 likely causal chains using the "5 Whys" technique.
      Each chain MUST consist of 2 to 4 levels of "Why" (drill-down factors).
      
      Output format: A raw JSON object with keys "PEOPLE", "METHODS", "EQUIPMENT", "ENVIRONMENT". 
      Each key maps to an ARRAY of string ARRAYS (where each inner array is a chain of whys).
      
      Example:
      {
        "PEOPLE": [
           ["Staff made an error", "Fatigue", "Double shift due to shortage"],
           ["Did not follow SOP", "SOP was confusing", "Poor document control"]
        ],
        "METHODS": [
           ["Process delayed", "Approval step bottleneck", "Manual signature required"]
        ],
        "EQUIPMENT": [
           ["Machine stopped", "Fuse blew", "Power surge"]
        ],
        "ENVIRONMENT": []
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJsonString(text));
    
    // Ensure structure
    return {
      PEOPLE: parsed.PEOPLE || [],
      METHODS: parsed.METHODS || [],
      EQUIPMENT: parsed.EQUIPMENT || [],
      ENVIRONMENT: parsed.ENVIRONMENT || []
    };
  } catch (error) {
    console.error("Error generating 4M factors:", error);
    return { PEOPLE: [], METHODS: [], EQUIPMENT: [], ENVIRONMENT: [] };
  }
};
