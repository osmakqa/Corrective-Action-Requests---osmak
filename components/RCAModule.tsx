import React, { useState, useEffect, useRef } from 'react';
import { RCAData, RCAChain, ParetoItem } from '../types';
import { Plus, Trash2, TrendingUp, Save, X, LayoutGrid, Sparkles, AlertCircle, Loader2, GitBranch, Bot, ArrowDown, ChevronDown, Split } from 'lucide-react';
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
  
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Ensure at least one chain exists if empty
  useEffect(() => {
    if (chains.length === 0 && !isReadOnly) {
      setChains([{
        id: crypto.randomUUID(),
        whys: ['']
      }]);
    }
  }, [isReadOnly, chains.length]);

  // --- AI Auto-Generation Logic (Hypothesis) ---
  useEffect(() => {
    if (isReadOnly) return;

    const timer = setTimeout(async () => {
      const hasFactors = chains.some(c => c.whys.some(w => w.trim().length > 0));

      if (!hasFactors) {
        if (rootCauseHypothesis !== '') setRootCauseHypothesis('');
        return;
      }

      setIsAiGenerating(true);

      try {
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
          5 Whys Analysis Chains: ${analysisText}
          Based on the causal chains provided above, synthesize a single, professional, and cohesive "Root Cause Hypothesis" sentence.
          Identify the deepest underlying cause from the chains. Do not add preamble.
        `;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
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
    }, 2500);

    return () => clearTimeout(timer);
  }, [chains, problemStatement, isReadOnly, rootCauseHypothesis]);

  const handleAutoFillFactors = async () => {
    setIsAiFillingFactors(true);
    const generatedChains = await generateRCAChains(problemStatement);
    
    setChains(prev => {
      const addedChains = generatedChains.map(chainWhys => ({
         id: crypto.randomUUID(),
         whys: chainWhys
      }));
      return [...prev, ...addedChains];
    });
    
    setIsAiFillingFactors(false);
  };

  const addChain = () => {
    setChains(prev => [...prev, {
      id: crypto.randomUUID(),
      whys: ['']
    }]);
  };

  const addBranch = (parentId: string, atLevel: number) => {
    setChains(prev => [...prev, {
      id: crypto.randomUUID(),
      parentId: parentId,
      parentLevel: atLevel,
      whys: ['']
    }]);
  };

  const addNextWhy = (chainId: string) => {
    setChains(prev => prev.map(c => {
      if (c.id === chainId) {
        return { ...c, whys: [...c.whys, ''] };
      }
      return c;
    }));
  };

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

  const removeWhy = (chainId: string, index: number) => {
    setChains(prev => prev.map(c => {
      if (c.id === chainId) {
        const newWhys = c.whys.filter((_, i) => i !== index);
        if (newWhys.length === 0) return { ...c, whys: [''] };
        return { ...c, whys: newWhys };
      }
      return c;
    }));
  };

  const removeChain = (chainId: string) => {
    setChains(prev => {
        const toRemove = new Set([chainId]);
        let size;
        do {
            size = toRemove.size;
            prev.forEach(c => {
                if (c.parentId && toRemove.has(c.parentId)) {
                    toRemove.add(c.id);
                }
            });
        } while (toRemove.size !== size);
        return prev.filter(c => !toRemove.has(c.id));
    });
  };
  
  const handleTabChange = async (tab: 'analysis' | 'fishbone' | 'pareto') => {
    setActiveTab(tab);
  };

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
  }, [activeTab, chains, paretoItems]);

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

  // Helper to calculate depth offset for visual alignment
  const getChainOffset = (chain: RCAChain): number => {
    if (!chain.parentId) return 0;
    const parent = chains.find(c => c.id === chain.parentId);
    if (!parent) return 0;
    return (chain.parentLevel ?? 0) + 1 + getChainOffset(parent);
  };

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
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold inline-flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 mr-2"
              >
                {isAiFillingFactors ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
                AI Assist
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
          
          {/* TAB 1: 5 WHYS ANALYSIS (Hierarchical Flowchart) */}
          {activeTab === 'analysis' && (
            <div className="flex flex-col h-full min-w-max relative">
               
               {/* SVG Connectors Layer */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                   <defs>
                       <marker id="branch-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                           <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                       </marker>
                   </defs>
                   {chains.map(chain => {
                       if (!chain.parentId) return null;
                       const parentCardId = `${chain.parentId}-${chain.parentLevel}`;
                       const childCardId = `${chain.id}-0`;
                       
                       const parentBox = cardRefs.current[parentCardId]?.getBoundingClientRect();
                       const childBox = cardRefs.current[childCardId]?.getBoundingClientRect();
                       const containerBox = cardRefs.current['analysis-container']?.getBoundingClientRect();

                       if (parentBox && childBox && containerBox) {
                           const startX = parentBox.right - containerBox.left;
                           const startY = parentBox.top + parentBox.height / 2 - containerBox.top;
                           const endX = childBox.left - containerBox.left;
                           const endY = childBox.top + childBox.height / 2 - containerBox.top;

                           return (
                               <path 
                                   key={`path-${chain.id}`}
                                   d={`M ${startX} ${startY} H ${startX + 20} V ${endY} H ${endX}`}
                                   stroke="#94a3b8"
                                   strokeWidth="2"
                                   fill="none"
                                   markerEnd="url(#branch-arrow)"
                                   strokeDasharray="4 2"
                               />
                           );
                       }
                       return null;
                   })}
               </svg>

               <div id="analysis-container" ref={(el) => { cardRefs.current['analysis-container'] = el; }} className="flex-1 flex flex-col items-center relative z-10">
                  
                  {/* Problem Statement Box (Root) */}
                  <div className="flex flex-col items-center shrink-0 mb-4">
                    <div className="bg-red-50 border-2 border-red-500 p-4 rounded-xl shadow-md max-w-2xl text-center">
                      <h4 className="flex items-center justify-center gap-2 text-red-800 font-bold mb-1 uppercase text-[10px] tracking-wider">
                         <AlertCircle size={14}/> Problem Statement
                      </h4>
                      <p className="text-red-900 font-bold text-sm leading-relaxed">"{problemStatement}"</p>
                    </div>
                    {chains.filter(c => !c.parentId).length > 0 && (
                        <div className="w-0.5 h-6 bg-gray-400"></div>
                    )}
                  </div>

                  {/* Columns of Chains and Branches */}
                  <div className="flex flex-nowrap gap-12 justify-center items-start pb-20">
                     {chains.map((chain, chainIdx) => {
                        const offset = getChainOffset(chain);
                        return (
                           <div key={chain.id} className="flex flex-col items-center">
                              {/* Spacers to align branch with its vertical fork point */}
                              {Array.from({ length: offset }).map((_, i) => (
                                 <div key={i} className="h-[120px] w-[280px]"></div>
                              ))}

                              <div className="flex flex-col items-center">
                                 <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100 mb-4">
                                    {chain.parentId ? `Branch from C${chains.findIndex(c => c.id === chain.parentId) + 1}` : `Chain ${chainIdx + 1}`}
                                 </div>

                                 {chain.whys.map((why, whyIdx) => (
                                    <React.Fragment key={whyIdx}>
                                       {whyIdx > 0 && (
                                          <div className="flex flex-col items-center">
                                             <div className="w-0.5 h-6 bg-blue-300"></div>
                                             <div className="text-blue-400 -mt-2 mb-1">
                                                <ChevronDown size={14} />
                                             </div>
                                          </div>
                                       )}
                                       
                                       <div 
                                          ref={(el) => { cardRefs.current[`${chain.id}-${whyIdx}`] = el; }}
                                          className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all group/card relative w-[280px]"
                                       >
                                          {!isReadOnly && (
                                             <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                <button 
                                                   onClick={() => addBranch(chain.id, whyIdx)}
                                                   className="text-indigo-400 hover:text-indigo-600 p-1 bg-indigo-50 rounded"
                                                   title="Branch from here"
                                                >
                                                   <Split size={12}/>
                                                </button>
                                                <button 
                                                   onClick={() => {
                                                      if (chain.whys.length === 1) removeChain(chain.id);
                                                      else removeWhy(chain.id, whyIdx);
                                                   }}
                                                   className="text-gray-300 hover:text-red-500 p-1"
                                                >
                                                   <X size={12}/>
                                                </button>
                                             </div>
                                          )}

                                          <div className="flex flex-col gap-1">
                                             <span className="text-[9px] font-bold uppercase text-gray-400">
                                                Level {whyIdx + 1 + offset}
                                             </span>
                                             <textarea 
                                                disabled={isReadOnly}
                                                rows={2}
                                                value={why}
                                                onChange={(e) => updateWhy(chain.id, whyIdx, e.target.value)}
                                                className="w-full p-2 text-xs border border-gray-100 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-gray-50 text-gray-900 resize-none font-medium"
                                                placeholder="Enter factor..."
                                             />
                                          </div>
                                       </div>
                                    </React.Fragment>
                                 ))}

                                 {!isReadOnly && (
                                    <div className="flex flex-col items-center">
                                       <div className="w-0.5 h-4 bg-gray-200"></div>
                                       <button 
                                          onClick={() => addNextWhy(chain.id)}
                                          className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm border border-blue-100"
                                          title="Add level"
                                       >
                                          <Plus size={16}/>
                                       </button>
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                     
                     {!isReadOnly && (
                        <div className="flex flex-col items-center pt-20">
                           <button 
                             onClick={addChain} 
                             className="group flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300"
                           >
                              <Plus size={24}/>
                              <span className="font-bold text-xs uppercase tracking-widest">New Chain</span>
                           </button>
                        </div>
                     )}
                  </div>
               </div>

               {/* Hypothesis synthesis - Sticky Bottom */}
               <div className="sticky bottom-0 mt-auto pt-6 bg-[#f8fafc]">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl shadow-lg border border-purple-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Sparkles size={100} className="text-purple-900"/>
                     </div>
                     
                     <div className="flex justify-between items-center mb-3 relative z-10">
                         <h3 className="font-bold text-purple-900 text-base flex items-center gap-2">
                            <Sparkles size={18} className="text-purple-600"/> RCA Hypothesis Synthesis
                         </h3>
                         {isAiGenerating && (
                            <span className="text-[10px] font-bold text-purple-600 bg-white/60 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse border border-purple-100">
                               <Loader2 size={12} className="animate-spin"/> AI Reasoning...
                            </span>
                         )}
                     </div>
                     
                     <textarea 
                       readOnly
                       className="w-full p-4 border border-purple-200 bg-white/80 backdrop-blur-sm rounded-lg text-gray-900 leading-relaxed font-bold text-sm resize-none focus:outline-none shadow-inner"
                       rows={2}
                       placeholder={isReadOnly ? "No synthesis provided." : "Start analyzing above to see the AI synthesize your root cause hypothesis..."}
                       value={rootCauseHypothesis}
                     />
                  </div>
               </div>
            </div>
          )}

          {/* TAB 2: FISHBONE (Unchanged as requested) */}
          {activeTab === 'fishbone' && (
              <div className="flex flex-col h-full">
                  <h3 className="font-bold text-gray-700 uppercase tracking-wide text-sm mb-4 flex justify-between items-center">
                      <span>Fishbone Diagram (Ishikawa)</span>
                  </h3>
                  
                  <div className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden relative p-4">
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

          {/* TAB 3: PARETO (Unchanged as requested) */}
          {activeTab === 'pareto' && (
            <div className="space-y-8 pb-10">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Frequency Input Table */}
                <div className="lg:col-span-4 bg-white p-4 rounded shadow border">
                   <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">1. Enter Frequency (Root Causes)</h3>
                   <div className="space-y-2 max-h-[400px] overflow-y-auto">
                     {paretoItems.map(item => (
                       <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                         <div className="flex-1 text-xs font-bold text-gray-700">{item.cause}</div>
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

// --- Fishbone SVG (Unchanged per request) ---
const FishboneSVG: React.FC<{ chains: RCAChain[], problem: string }> = ({ chains, problem }) => {
    const width = 1200;
    const height = 600;
    const padding = 50;
    const spineY = height / 2;
    const spineStartX = padding;
    const spineEndX = width - 350;
    const ribLength = 240;
    const ribAngle = 60 * (Math.PI / 180); 
    const topRibDy = -Math.sin(ribAngle) * ribLength;
    const topRibDx = -Math.cos(ribAngle) * ribLength;
    const bottomRibDy = Math.sin(ribAngle) * ribLength;
    const validChains = chains.filter(c => c.whys.some(w => w.trim()));
    const topChains = validChains.filter((_, i) => i % 2 === 0);
    const bottomChains = validChains.filter((_, i) => i % 2 !== 0);
    const spacing = (spineEndX - spineStartX) / (Math.max(Math.ceil(validChains.length / 2), 1) + 1);
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full preserve-3d">
            <defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#1e293b" /></marker></defs>
            <line x1={spineStartX} y1={spineY} x2={spineEndX} y2={spineY} stroke="#1e293b" strokeWidth="4" markerEnd="url(#arrowhead)" />
            <g transform={`translate(${spineEndX + 10}, ${spineY - 75})`}><rect x="0" y="0" width="300" height="150" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" rx="8" /><foreignObject x="10" y="10" width="280" height="130"><div className="h-full w-full flex items-center justify-center text-center overflow-auto custom-scrollbar p-1"><span className="text-red-900 font-bold text-sm md:text-base leading-tight">{problem}</span></div></foreignObject></g>
            {topChains.map((chain, i) => {
                const rootX = spineEndX - ((i + 1) * spacing);
                const tipX = rootX + topRibDx;
                const tipY = spineY + topRibDy;
                const items = chain.whys.filter(w => w.trim());
                return (
                    <g key={`top-${i}`}><line x1={tipX} y1={tipY} x2={rootX} y2={spineY} stroke="#334155" strokeWidth="2" />
                        {items.map((item, j) => {
                             const itemY = tipY + ((j + 1) * 45);
                             const itemXStart = tipX + ((j + 1) * (topRibDx / -4));
                             return (
                                 <g key={`t-item-${j}`}><line x1={itemXStart} y1={itemY} x2={itemXStart + 220} y2={itemY} stroke="#94a3b8" strokeWidth="1" /><foreignObject x={itemXStart + 5} y={itemY - 30} width="210" height="60"><div className="h-full w-full flex items-center text-[10px] md:text-[11px] font-medium text-slate-700 leading-tight p-0.5"><span className="w-full text-left break-words overflow-auto no-scrollbar">{item}</span></div></foreignObject></g>
                             );
                        })}
                    </g>
                );
            })}
            {bottomChains.map((chain, i) => {
                const rootX = spineEndX - ((i + 1) * spacing) - (spacing/2); 
                const tipX = rootX + topRibDx;
                const tipY = spineY + bottomRibDy;
                const items = chain.whys.filter(w => w.trim());
                return (
                    <g key={`bot-${i}`}><line x1={tipX} y1={tipY} x2={rootX} y2={spineY} stroke="#334155" strokeWidth="2" />
                        {items.map((item, j) => {
                             const itemY = tipY - ((j + 1) * 45);
                             const itemXStart = tipX + ((j + 1) * (topRibDx / -4));
                             return (
                                 <g key={`b-item-${j}`}><line x1={itemXStart} y1={itemY} x2={itemXStart + 220} y2={itemY} stroke="#94a3b8" strokeWidth="1" /><foreignObject x={itemXStart + 5} y={itemY - 30} width="210" height="60"><div className="h-full w-full flex items-center text-[10px] md:text-[11px] font-medium text-slate-700 leading-tight p-0.5"><span className="w-full text-left break-words overflow-auto no-scrollbar">{item}</span></div></foreignObject></g>
                             );
                        })}
                    </g>
                );
            })}
        </svg>
    );
};

// --- Pareto Chart (Unchanged per request) ---
const ParetoSVGChart: React.FC<{ data: (ParetoItem & { percent: number, cumulative: number })[], totalFreq: number }> = ({ data, totalFreq }) => {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const maxFreq = data.length > 0 ? Math.max(...data.map(d => d.frequency)) : 10;
  const yLeftMax = Math.ceil(maxFreq * 1.1); 
  const xBandWidth = data.length > 0 ? graphWidth / data.length : graphWidth;
  const barWidth = Math.min(xBandWidth * 0.6, 60);
  const scaleYLeft = (val: number) => graphHeight - (val / yLeftMax) * graphHeight;
  const scaleYRight = (val: number) => graphHeight - (val / 100) * graphHeight;
  let pathD = `M `;
  data.forEach((d, i) => { const x = (i * xBandWidth) + (xBandWidth / 2); const y = scaleYRight(d.cumulative); pathD += `${i === 0 ? '' : 'L '}${x} ${y} `; });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-white border">
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <line x1={0} y1={graphHeight} x2={graphWidth} y2={graphHeight} stroke="#000" strokeWidth="1" /><line x1={0} y1={0} x2={0} y2={graphHeight} stroke="#000" strokeWidth="1" />
        {data.map((d, i) => {
          const x = (i * xBandWidth) + (xBandWidth - barWidth) / 2;
          const h = graphHeight - scaleYLeft(d.frequency);
          const y = scaleYLeft(d.frequency);
          return (
            <g key={`bar-${i}`}>
              <rect x={x} y={y} width={barWidth} height={h} fill="#3b82f6" />
              <circle cx={(i * xBandWidth) + (xBandWidth / 2)} cy={scaleYRight(d.cumulative)} r={4} fill="#ef4444" />
            </g>
          );
        })}
        {data.length > 0 && <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="2" />}
      </g>
    </svg>
  );
};