




import React, { useState, useEffect, useRef } from 'react';
import { RCAData, RCAChain, ParetoItem } from '../types';
import { Plus, Trash2, ArrowRight, TrendingUp, Save, X, LayoutGrid, Sparkles, AlertCircle, Loader2, GitBranch } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generateRCAChains } from '../services/aiService';

interface RCAModuleProps {
  initialData: RCAData;
  problemStatement: string;
  onSave: (data: RCAData) => void;
  onCancel: () => void;
  isReadOnly: boolean;
}

export const RCAModule: React.FC<RCAModuleProps> = ({ initialData, problemStatement, onSave, onCancel, isReadOnly }) => {
  const [chains, setChains] = useState<RCAChain[]>(initialData.chains || []);
  const [paretoItems, setParetoItems] = useState<ParetoItem[]>(initialData.paretoItems || []);
  const [rootCauseHypothesis, setRootCauseHypothesis] = useState(initialData.rootCauseHypothesis || '');
  const [activeTab, setActiveTab] = useState<'analysis' | 'fishbone' | 'pareto'>('analysis');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiFillingFactors, setIsAiFillingFactors] = useState(false);

  // Ensure at least one chain exists if empty
  useEffect(() => {
    if (chains.length === 0 && !isReadOnly) {
      setChains([{
        id: crypto.randomUUID(),
        whys: ['']
      }]);
    }
  }, []);

  // --- AI Auto-Generation Logic (Hypothesis) ---
  useEffect(() => {
    // Skip if read only
    if (isReadOnly) return;

    // Debounce timer to avoid calling API on every keystroke
    const timer = setTimeout(async () => {
      // Check if we have any factors entered
      const hasFactors = chains.some(c => c.whys.some(w => w.trim().length > 0));

      if (!hasFactors) {
        if (rootCauseHypothesis !== '') setRootCauseHypothesis('');
        return;
      }

      setIsAiGenerating(true);

      try {
        // Construct the prompt context representing chains
        let analysisText = "";
        chains.forEach(c => {
           const validFactors = c.whys.filter(w => w.trim());
           if (validFactors.length > 0) {
             analysisText += `- Chain: ${validFactors.join(' -> caused -> ')}\n`;
           }
        });

        const prompt = `
          You are a Quality Assurance expert specializing in Root Cause Analysis (ISO 9001:2015).
          
          Problem Statement: "${problemStatement}"
          
          5 Whys Analysis Chains:
          ${analysisText}
          
          Based on the causal chains provided above, synthesize a single, professional, and cohesive "Root Cause Hypothesis" sentence.
          Identify the deepest underlying cause from the chains.
          Do not add preamble.
        `;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        
        if (response.text) {
          setRootCauseHypothesis(response.text.trim());
        }
      } catch (error) {
        console.error("AI Generation failed", error);
      } finally {
        setIsAiGenerating(false);
      }

    }, 2500); // Increased delay for 5 whys typing

    return () => clearTimeout(timer);
  }, [chains, problemStatement, isReadOnly]);

  // --- AI Factor Generation ---
  const handleAutoFillFactors = async () => {
    setIsAiFillingFactors(true);
    const generatedChains = await generateRCAChains(problemStatement);
    
    setChains(prev => {
      const newChains = [...prev];
      
      // Filter out empty placeholder if it exists and hasn't been touched
      const cleanedPrev = newChains.filter(c => c.whys.some(w => w.trim()));
      
      const addedChains = generatedChains.map(chainWhys => ({
         id: crypto.randomUUID(),
         whys: chainWhys
      }));

      return [...cleanedPrev, ...addedChains];
    });
    
    setIsAiFillingFactors(false);
  };

  // Add a new empty chain
  const addChain = () => {
    setChains(prev => [...prev, {
      id: crypto.randomUUID(),
      whys: ['']
    }]);
  };

  // Add next 'Why' level to a specific chain
  const addNextWhy = (chainId: string) => {
    setChains(prev => prev.map(c => {
      if (c.id === chainId) {
        return { ...c, whys: [...c.whys, ''] };
      }
      return c;
    }));
  };

  // Update 'Why' value
  const updateWhy = (chainId: string, index: number, value: string) => {
    setChains(prev => prev.map(c => {
      if (c.id === chainId) {
        const newWhys = [...c.whys];
        newWhys[index] = value;
        return { ...c, whys: newWhys };
      }
      return c;
    }));
  };

  // Remove a 'Why' level or the whole chain if it's the last one
  const removeWhy = (chainId: string, index: number) => {
    setChains(prev => prev.map(c => {
      if (c.id === chainId) {
        const newWhys = c.whys.filter((_, i) => i !== index);
        if (newWhys.length === 0) return { ...c, whys: [''] }; // Keep at least one empty
        return { ...c, whys: newWhys };
      }
      return c;
    }));
  };

  // Remove entire chain
  const removeChain = (chainId: string) => {
    setChains(prev => prev.filter(c => c.id !== chainId));
  };
  
  // Handle Tab Switch
  const handleTabChange = async (tab: 'analysis' | 'fishbone' | 'pareto') => {
    setActiveTab(tab);
  };

  // Sync Pareto Data
  useEffect(() => {
    if (activeTab === 'pareto') {
      const potentialRootCauses: {id: string, cause: string}[] = [];
      
      chains.forEach(chain => {
        const validWhys = chain.whys.filter(w => w.trim());
        if (validWhys.length > 0) {
           const root = validWhys[validWhys.length - 1];
           potentialRootCauses.push({
             id: chain.id, 
             cause: root
           });
        }
      });

      const newItems: ParetoItem[] = potentialRootCauses.map(f => {
        const existing = paretoItems.find(p => p.cause === f.cause);
        return {
          id: f.id,
          cause: f.cause,
          frequency: existing ? existing.frequency : 0
        };
      });
      setParetoItems(newItems);
    }
  }, [activeTab]);

  const handleFrequencyChange = (cause: string, freq: number) => {
    setParetoItems(prev => prev.map(p => p.cause === cause ? { ...p, frequency: freq } : p));
  };

  const saveRCA = () => {
    onSave({ 
      chains, 
      paretoItems,
      rootCauseHypothesis 
    });
  };

  // --- Pareto Calculations ---
  const sortedPareto = [...paretoItems].sort((a, b) => b.frequency - a.frequency);
  const totalFrequency = sortedPareto.reduce((sum, item) => sum + item.frequency, 0);
  
  let runningCum = 0;
  const paretoData = sortedPareto.map(item => {
    const percent = totalFrequency === 0 ? 0 : (item.frequency / totalFrequency) * 100;
    runningCum += percent;
    return {
      ...item,
      percent: percent,
      cumulative: runningCum
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-green-800 text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300"/> 
              AI-Assisted Root Cause Analysis
            </h2>
            <p className="text-xs text-green-200 opacity-80 mt-1">5 Whys Principle • Fishbone Diagram • Pareto Chart</p>
          </div>
          <div className="space-x-2 flex items-center">
            {!isReadOnly && activeTab === 'analysis' && (
              <button 
                onClick={handleAutoFillFactors}
                disabled={isAiFillingFactors}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-bold inline-flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 mr-2"
              >
                {isAiFillingFactors ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Auto-Generate Analysis
              </button>
            )}
            {!isReadOnly && (
               <button onClick={saveRCA} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold inline-flex items-center gap-2 shadow-sm transition-colors">
                  <Save size={18}/> Save Analysis
               </button>
            )}
            <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-bold transition-colors">
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-200 shrink-0">
          <button onClick={() => handleTabChange('analysis')} className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${activeTab === 'analysis' ? 'bg-white text-green-800 border-t-4 border-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
            <LayoutGrid size={18}/> 5 Whys Analysis
          </button>
          <button onClick={() => handleTabChange('fishbone')} className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${activeTab === 'fishbone' ? 'bg-white text-green-800 border-t-4 border-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
            <GitBranch size={18}/> Fishbone Diagram
          </button>
          <button onClick={() => handleTabChange('pareto')} className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${activeTab === 'pareto' ? 'bg-white text-green-800 border-t-4 border-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
            <TrendingUp size={18}/> Pareto Chart
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          
          {/* TAB 1: 5 WHYS ANALYSIS (List View) */}
          {activeTab === 'analysis' && (
            <div className="flex flex-col h-full space-y-6">
               
               {/* Problem Statement Card */}
               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm shrink-0">
                  <h4 className="flex items-center gap-2 text-red-800 font-bold mb-1 uppercase text-xs tracking-wider">
                     <AlertCircle size={14}/> Problem Statement
                  </h4>
                  <p className="text-red-900 font-medium text-sm leading-relaxed">"{problemStatement}"</p>
               </div>

               {/* Analysis Chains List */}
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-700 uppercase tracking-wide text-sm">Analysis Chains</h3>
                     {!isReadOnly && (
                        <button onClick={addChain} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                           <Plus size={16}/> Add New Chain
                        </button>
                     )}
                  </div>

                  <div className="space-y-4">
                     {chains.map((chain, chainIdx) => (
                        <div key={chain.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors group/card relative">
                           {/* Remove Chain Button */}
                           {!isReadOnly && (
                              <button 
                                 onClick={() => removeChain(chain.id)} 
                                 className="absolute right-3 top-3 text-gray-300 hover:text-red-500 transition-colors p-1"
                                 title="Delete Chain"
                              >
                                 <Trash2 size={16}/>
                              </button>
                           )}

                           <div className="flex flex-wrap items-start gap-2">
                              {chain.whys.map((why, whyIdx) => (
                                 <React.Fragment key={whyIdx}>
                                    {/* Arrow */}
                                    {whyIdx > 0 && (
                                       <div className="flex items-center justify-center pt-2">
                                          <ArrowRight size={16} className="text-gray-300" />
                                       </div>
                                    )}

                                    <div className="flex-1 min-w-[200px] max-w-[300px] flex flex-col gap-1">
                                       <span className="text-[10px] font-bold uppercase text-gray-400 pl-1">
                                          {`Why? (${whyIdx + 1})`}
                                       </span>
                                       <div className="relative">
                                          <input 
                                             disabled={isReadOnly}
                                             value={why}
                                             onChange={(e) => updateWhy(chain.id, whyIdx, e.target.value)}
                                             className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white border-gray-300 text-gray-800"
                                             placeholder="Why?"
                                          />
                                          {!isReadOnly && (
                                             <button 
                                                onClick={() => {
                                                   if (chain.whys.length === 1) removeChain(chain.id);
                                                   else removeWhy(chain.id, whyIdx);
                                                }}
                                                className="absolute right-2 top-2.5 text-gray-300 hover:text-red-500 p-0.5"
                                             >
                                                <X size={12}/>
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 </React.Fragment>
                              ))}

                              {/* Add Next Why Button */}
                              {!isReadOnly && (
                                 <div className="flex items-center pt-6">
                                    <button 
                                       onClick={() => addNextWhy(chain.id)}
                                       className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                       title="Add Next Why"
                                    >
                                       <Plus size={16}/>
                                    </button>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                     {chains.length === 0 && <p className="text-center text-gray-400 italic py-10">No analysis chains started. Click 'Add New Chain' to begin.</p>}
                  </div>
               </div>

               {/* Final Hypothesis (AI Generated) */}
               <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl shadow-sm border border-purple-100 shrink-0 relative overflow-hidden mt-4">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Sparkles size={100} className="text-purple-900"/>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3 relative z-10">
                      <h3 className="font-bold text-purple-900 text-lg flex items-center gap-2">
                         <Sparkles size={18} className="text-purple-600"/> Final Root Cause Hypothesis
                      </h3>
                      <div className="flex items-center gap-2">
                        {isAiGenerating ? (
                           <span className="text-xs font-bold text-purple-600 bg-white/50 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                              <Loader2 size={12} className="animate-spin"/> AI Generating...
                           </span>
                        ) : (
                           <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Auto-Generated</span>
                        )}
                      </div>
                  </div>
                  
                  <textarea 
                    readOnly
                    className="w-full p-4 border border-purple-200 bg-white rounded-lg text-gray-900 leading-relaxed font-medium resize-none focus:outline-none shadow-inner"
                    rows={2}
                    placeholder={isReadOnly ? "No hypothesis generated." : "Complete the 5 Whys analysis above to auto-generate the hypothesis..."}
                    value={rootCauseHypothesis}
                  />
               </div>
            </div>
          )}

          {/* TAB 2: FISHBONE (Dynamic Layout based on Chains) */}
          {activeTab === 'fishbone' && (
              <div className="flex flex-col h-full">
                  <h3 className="font-bold text-gray-700 uppercase tracking-wide text-sm mb-4 flex justify-between items-center">
                      <span>Fishbone Diagram (Ishikawa)</span>
                  </h3>
                  
                  <div className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden relative">
                      {chains.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-gray-400 italic">
                              No data to visualize. Add chains in the "5 Whys Analysis" tab first.
                          </div>
                      ) : (
                          <FishboneSVG chains={chains} problem={problemStatement} />
                      )}
                  </div>
              </div>
          )}

          {/* TAB 3: PARETO */}
          {activeTab === 'pareto' && (
            <div className="space-y-8 pb-10">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Frequency Input Table */}
                <div className="lg:col-span-4 bg-white p-4 rounded shadow border">
                   <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">1. Enter Frequency (Root Causes)</h3>
                   <div className="space-y-2 max-h-[400px] overflow-y-auto">
                     {paretoItems.map(item => (
                       <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                         <div className="flex-1">
                           <div className="text-xs font-bold text-gray-700">{item.cause}</div>
                         </div>
                         <input 
                           type="number" 
                           disabled={isReadOnly}
                           min="0"
                           className="w-20 bg-white text-gray-900 border border-gray-300 p-1 rounded text-right font-mono"
                           value={item.frequency}
                           onChange={(e) => handleFrequencyChange(item.cause, parseInt(e.target.value) || 0)}
                         />
                       </div>
                     ))}
                     {paretoItems.length === 0 && <p className="text-sm text-gray-500 italic">No root causes identified. Add chains in '5 Whys Analysis'.</p>}
                   </div>
                </div>

                {/* 2. Calculated Table */}
                <div className="lg:col-span-8 bg-white p-4 rounded shadow border overflow-x-auto">
                   <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">2. Pareto Data Table</h3>
                   <table className="w-full text-sm text-left border-collapse border border-gray-300">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="p-2 border border-gray-300">ROOT CAUSE</th>
                          <th className="p-2 border border-gray-300 text-right">FREQUENCY</th>
                          <th className="p-2 border border-gray-300 text-right">TOTAL %</th>
                          <th className="p-2 border border-gray-300 text-right">CUMULATIVE %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paretoData.map((row, idx) => (
                          <tr key={idx} className={`hover:bg-gray-50 ${row.cumulative <= 80 ? 'bg-blue-50' : ''}`}>
                             <td className="p-2 border border-gray-300 font-medium truncate max-w-[200px]" title={row.cause}>{row.cause}</td>
                             <td className="p-2 border border-gray-300 text-right">{row.frequency}</td>
                             <td className="p-2 border border-gray-300 text-right">{row.percent.toFixed(2)}%</td>
                             <td className="p-2 border border-gray-300 text-right font-bold text-blue-700">{row.cumulative.toFixed(2)}%</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                           <td className="p-2 border border-gray-300">TOTAL</td>
                           <td className="p-2 border border-gray-300 text-right">{totalFrequency}</td>
                           <td className="p-2 border border-gray-300 text-right">100.00%</td>
                           <td className="p-2 border border-gray-300 text-right">100.00%</td>
                        </tr>
                      </tbody>
                   </table>
                   <p className="text-xs text-blue-600 mt-2 font-medium">* Highlighted rows indicate root causes within the top 80% (Vital Few) that will be auto-selected.</p>
                </div>

                {/* 3. SVG Chart */}
                <div className="lg:col-span-12 bg-white p-6 rounded shadow border">
                  <h3 className="font-bold text-gray-800 mb-6 text-center text-lg">PARETO CHART</h3>
                  
                  {totalFrequency > 0 && paretoData.length > 0 ? (
                    <div className="w-full flex justify-center">
                      <ParetoSVGChart data={paretoData} totalFreq={totalFrequency} />
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded">
                      Add frequencies to generate visualization
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Helper Icon
const PlusCircleIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);

// --- Fishbone SVG ---
const FishboneSVG: React.FC<{ chains: RCAChain[], problem: string }> = ({ chains, problem }) => {
    const width = 1000;
    const height = 500;
    const padding = 50;
    
    // Spine
    const spineY = height / 2;
    const spineStartX = padding;
    const spineEndX = width - 250; // Room for head

    // Rib Geometry
    const ribLength = 180;
    const ribAngle = 60 * (Math.PI / 180); // 60 degrees in radians
    const topRibDy = -Math.sin(ribAngle) * ribLength;
    const topRibDx = -Math.cos(ribAngle) * ribLength;
    const bottomRibDy = Math.sin(ribAngle) * ribLength;
    
    // Distribute chains top and bottom (each chain is a bone)
    // Filter out chains with no content to avoid empty sticks
    const validChains = chains.filter(c => c.whys.some(w => w.trim()));
    const topChains = validChains.filter((_, i) => i % 2 === 0);
    const bottomChains = validChains.filter((_, i) => i % 2 !== 0);

    const spacing = (spineEndX - spineStartX) / (Math.ceil(validChains.length / 2) + 1);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#1e293b" />
                </marker>
            </defs>
            
            {/* Main Spine */}
            <line 
                x1={spineStartX} y1={spineY} 
                x2={spineEndX} y2={spineY} 
                stroke="#1e293b" strokeWidth="4" 
                markerEnd="url(#arrowhead)" 
            />

            {/* Head (Problem) */}
            <g transform={`translate(${spineEndX + 20}, ${spineY})`}>
                <rect x="0" y="-40" width="200" height="80" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" rx="8" />
                <text x="100" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="bold" fill="#7f1d1d" className="truncate">
                    {problem.length > 50 ? problem.substring(0, 50) + '...' : problem}
                </text>
            </g>

            {/* Top Ribs */}
            {topChains.map((chain, i) => {
                const rootX = spineEndX - ((i + 1) * spacing);
                const tipX = rootX + topRibDx;
                const tipY = spineY + topRibDy;
                
                // Whys are the items on the bone
                const items = chain.whys.filter(w => w.trim());

                return (
                    <g key={`top-${i}`}>
                        {/* Rib Line */}
                        <line x1={tipX} y1={tipY} x2={rootX} y2={spineY} stroke="#334155" strokeWidth="2" />
                        
                        {/* Items */}
                        {items.map((item, j) => {
                             const itemY = tipY + ((j + 1) * 25);
                             const itemXStart = tipX + ((j + 1) * (topRibDx / -4)); // Slant offset
                             return (
                                 <g key={`t-item-${j}`}>
                                     <line x1={itemXStart} y1={itemY} x2={itemXStart + 100} y2={itemY} stroke="#64748b" strokeWidth="1" />
                                     <text x={itemXStart + 105} y={itemY + 4} fontSize="10" fill="#334155">{item}</text>
                                 </g>
                             );
                        })}
                    </g>
                );
            })}

            {/* Bottom Ribs */}
            {bottomChains.map((chain, i) => {
                const rootX = spineEndX - ((i + 1) * spacing) - (spacing/2); // Offset slightly
                const tipX = rootX + topRibDx;
                const tipY = spineY + bottomRibDy;
                
                const items = chain.whys.filter(w => w.trim());

                return (
                    <g key={`bot-${i}`}>
                        {/* Rib Line */}
                        <line x1={tipX} y1={tipY} x2={rootX} y2={spineY} stroke="#334155" strokeWidth="2" />
                        
                        {/* Items */}
                        {items.map((item, j) => {
                             const itemY = tipY - ((j + 1) * 25);
                             const itemXStart = tipX + ((j + 1) * (topRibDx / -4));
                             return (
                                 <g key={`b-item-${j}`}>
                                     <line x1={itemXStart} y1={itemY} x2={itemXStart + 100} y2={itemY} stroke="#64748b" strokeWidth="1" />
                                     <text x={itemXStart + 105} y={itemY + 4} fontSize="10" fill="#334155">{item}</text>
                                 </g>
                             );
                        })}
                    </g>
                );
            })}

        </svg>
    );
};

// --- Sub-component: Pure SVG Pareto Chart ---
const ParetoSVGChart: React.FC<{ data: (ParetoItem & { percent: number, cumulative: number })[], totalFreq: number }> = ({ data, totalFreq }) => {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  // Scales
  const maxFreq = data[0].frequency;
  const yLeftMax = Math.ceil(maxFreq * 1.1); // 10% headroom
  const xBandWidth = graphWidth / data.length;
  const barWidth = Math.min(xBandWidth * 0.6, 60);

  // Helper to scale Y (Left)
  const scaleYLeft = (val: number) => graphHeight - (val / yLeftMax) * graphHeight;
  
  // Helper to scale Y (Right - %)
  const scaleYRight = (val: number) => graphHeight - (val / 100) * graphHeight;

  // Line Path Generator
  let pathD = `M `;
  data.forEach((d, i) => {
    const x = (i * xBandWidth) + (xBandWidth / 2); // center of band
    const y = scaleYRight(d.cumulative);
    pathD += `${i === 0 ? '' : 'L '}${x} ${y} `;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-4xl border border-gray-200 bg-white">
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        
        {/* Axes Lines */}
        <line x1={0} y1={graphHeight} x2={graphWidth} y2={graphHeight} stroke="#000" strokeWidth="1" /> {/* X Axis */}
        <line x1={0} y1={0} x2={0} y2={graphHeight} stroke="#000" strokeWidth="1" /> {/* Y Left */}
        <line x1={graphWidth} y1={0} x2={graphWidth} y2={graphHeight} stroke="#000" strokeWidth="1" /> {/* Y Right */}

        {/* Y Axis Left Labels (Frequency) */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const val = Math.round(yLeftMax * tick);
          const y = scaleYLeft(val);
          return (
            <g key={`y-left-${tick}`}>
              <line x1={-5} y1={y} x2={0} y2={y} stroke="#000" />
              <text x={-10} y={y + 4} textAnchor="end" fontSize="10" fill="#333">{val}</text>
              <line x1={0} y1={y} x2={graphWidth} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" /> {/* Grid */}
            </g>
          );
        })}

        {/* Y Axis Right Labels (Percentage) */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = scaleYRight(val);
          return (
            <g key={`y-right-${val}`}>
              <line x1={graphWidth} y1={y} x2={graphWidth + 5} y2={y} stroke="#000" />
              <text x={graphWidth + 10} y={y + 4} textAnchor="start" fontSize="10" fill="#333">{val}%</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = (i * xBandWidth) + (xBandWidth - barWidth) / 2;
          const h = graphHeight - scaleYLeft(d.frequency);
          const y = scaleYLeft(d.frequency);
          
          return (
            <g key={`bar-${i}`}>
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={h} 
                fill="#3b82f6" 
                className="hover:opacity-80 transition-opacity"
              />
              <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1d4ed8">
                {d.frequency}
              </text>
            </g>
          );
        })}

        {/* Line Chart (Cumulative %) */}
        <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" />
        
        {/* Line Points */}
        {data.map((d, i) => {
          const x = (i * xBandWidth) + (xBandWidth / 2);
          const y = scaleYRight(d.cumulative);
          return (
            <circle key={`pt-${i}`} cx={x} cy={y} r={4} fill="#ef4444" stroke="#fff" strokeWidth="2" />
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => {
           const x = (i * xBandWidth) + (xBandWidth / 2);
           return (
             <text 
               key={`label-${i}`} 
               x={0} 
               y={0} 
               fontSize="10" 
               textAnchor="end" 
               transform={`translate(${x}, ${graphHeight + 15}) rotate(-45)`}
               fill="#333"
             >
               {d.cause.length > 15 ? d.cause.substring(0, 15) + '...' : d.cause}
             </text>
           );
        })}

        {/* Legends */}
        <g transform={`translate(${graphWidth / 2 - 60}, -20)`}>
           <rect x="0" y="0" width="10" height="10" fill="#3b82f6" />
           <text x="15" y="9" fontSize="10">Frequency</text>
           
           <line x1="80" y1="5" x2="100" y2="5" stroke="#ef4444" strokeWidth="2" />
           <circle cx="90" cy="5" r="2" fill="#ef4444" />
           <text x="105" y="9" fontSize="10">Cumulative %</text>
           
           <line x1="160" y1="5" x2="250" y2="5" stroke="#000" strokeWidth="1" strokeDasharray="4 4" />
           <text x="255" y="9" fontSize="10">80% Threshold</text>
        </g>
        
        {/* 80% Line */}
        <line x1={0} y1={scaleYRight(80)} x2={graphWidth} y2={scaleYRight(80)} stroke="#000" strokeWidth="1" strokeDasharray="4 4" />

      </g>
    </svg>
  );
};
