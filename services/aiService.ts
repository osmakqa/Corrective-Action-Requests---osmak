
import { GoogleGenAI } from "@google/genai";
import { RCAChain } from '../types';

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

    // @fix: Updated model to gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    // @fix: Updated model to gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    // @fix: Updated model to gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
