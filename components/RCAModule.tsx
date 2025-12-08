
import React, { useState, useEffect, useRef } from 'react';
import { RCAData, RCAChain, ParetoItem } from '../types';
import { Plus, Trash2, ArrowRight, TrendingUp, Fish, Save, X, LayoutGrid, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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

  // Categories for Factor Analysis
  const CATEGORIES = ['PEOPLE', 'METHODS', 'EQUIPMENT', 'ENVIRONMENT'];

  // Initialize chains for categories if missing
  useEffect(() => {
    const existingCategories = new Set(chains.map(c => c.category));
    const missing = CATEGORIES.filter(cat => !existingCategories.has(cat));
    
    if (missing.length > 0) {
      const newChains = missing.map(cat => ({
        id: cat, // Use category name as ID for simplicity in 4M model
        category: cat,
        whys: [] // These are the factors
      }));
      setChains(prev => [...prev, ...newChains]);
    }
  }, []);

  // --- AI Auto-Generation Logic ---
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
        // Construct the prompt context
        let factorsText = "";
        chains.forEach(c => {
           const validFactors = c.whys.filter(w => w.trim());
           if (validFactors.length > 0) {
             factorsText += `- ${c.category}: ${validFactors.join(', ')}\n`;
           }
        });

        const prompt = `
          You are a Quality Assurance expert specializing in Root Cause Analysis (ISO 9001:2015).
          
          Problem Statement: "${problemStatement}"
          
          Identified Factors (4M Analysis):
          ${factorsText}
          
          Based strictly on the factors provided above, generate a single, professional, and cohesive "Root Cause Hypothesis" sentence. 
          Do not add preamble. Connect the factors logically to the problem.
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
        // Fallback or silent fail - we don't want to disrupt the UI too much
      } finally {
        setIsAiGenerating(false);
      }

    }, 2000); // 2 second delay after typing stops

    return () => clearTimeout(timer);
  }, [chains, problemStatement, isReadOnly]);


  // Add factor to a category
  const addFactor = (category: string) => {
    setChains(prev => prev.map(c => {
      if (c.category === category) {
        return { ...c, whys: [...c.whys, ''] };
      }
      return c;
    }));
  };

  // Update factor value
  const updateFactor = (category: string, index: number, value: string) => {
    setChains(prev => prev.map(c => {
      if (c.category === category) {
        const newFactors = [...c.whys];
        newFactors[index] = value;
        return { ...c, whys: newFactors };
      }
      return c;
    }));
  };

  // Remove factor
  const removeFactor = (category: string, index: number) => {
    setChains(prev => prev.map(c => {
      if (c.category === category) {
        return { ...c, whys: c.whys.filter((_, i) => i !== index) };
      }
      return c;
    }));
  };

  // Sync Pareto Data
  useEffect(() => {
    if (activeTab === 'pareto') {
      // Flatten all factors into pareto items
      const currentFactors: {id: string, cause: string}[] = [];
      chains.forEach(chain => {
        chain.whys.forEach((factor, idx) => {
          if (factor.trim()) {
            currentFactors.push({
              id: `${chain.category}-${idx}`,
              cause: factor
            });
          }
        });
      });

      // Map to Pareto Items (preserve frequency if exists)
      const newItems: ParetoItem[] = currentFactors.map(f => {
        const existing = paretoItems.find(p => p.cause === f.cause); // match by name since IDs might shift
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
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-green-800 text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300"/> 
              AI-Assisted Root Cause Analysis
            </h2>
            <p className="text-xs text-green-200 opacity-80 mt-1">4M Method • Fishbone • Pareto</p>
          </div>
          <div className="space-x-2">
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
          <button onClick={() => setActiveTab('analysis')} className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${activeTab === 'analysis' ? 'bg-white text-green-800 border-t-4 border-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
            <LayoutGrid size={18}/> Factor Analysis
          </button>
          <button onClick={() => setActiveTab('fishbone')} className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${activeTab === 'fishbone' ? 'bg-white text-green-800 border-t-4 border-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Fish size={18}/> Fishbone Diagram
          </button>
          <button onClick={() => setActiveTab('pareto')} className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${activeTab === 'pareto' ? 'bg-white text-green-800 border-t-4 border-green-600 shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
            <TrendingUp size={18}/> Pareto Chart
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc]">
          
          {/* TAB 1: FACTOR ANALYSIS (4M) */}
          {activeTab === 'analysis' && (
            <div className="flex flex-col h-full space-y-6">
               
               {/* Problem Statement Card */}
               <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm shrink-0">
                  <h4 className="flex items-center gap-2 text-red-800 font-bold mb-1 uppercase text-xs tracking-wider">
                     <AlertCircle size={14}/> Problem Statement
                  </h4>
                  <p className="text-red-900 font-medium text-sm leading-relaxed">"{problemStatement}"</p>
               </div>

               {/* Factors Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                 {CATEGORIES.map(cat => {
                   const chain = chains.find(c => c.category === cat) || { whys: [] };
                   return (
                     <div key={cat} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                           <h3 className="font-bold text-gray-600 uppercase text-sm tracking-wide">{cat}</h3>
                           <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{chain.whys.filter(w => w).length} Factors</span>
                        </div>
                        
                        <div className="space-y-2 flex-1 overflow-y-auto min-h-[120px]">
                           {chain.whys.map((factor, idx) => (
                              <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                 <input 
                                   disabled={isReadOnly}
                                   value={factor}
                                   onChange={(e) => updateFactor(cat, idx, e.target.value)}
                                   className="flex-1 p-2 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                   placeholder={`Add ${cat.toLowerCase()} factor...`}
                                   autoFocus={!factor} 
                                 />
                                 {!isReadOnly && (
                                   <button onClick={() => removeFactor(cat, idx)} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                                      <X size={16}/>
                                   </button>
                                 )}
                              </div>
                           ))}
                           {chain.whys.length === 0 && <p className="text-xs text-gray-300 italic p-2">No factors added.</p>}
                        </div>
                        {!isReadOnly && (
                           <button onClick={() => addFactor(cat)} className="mt-3 w-full border border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 font-bold hover:bg-gray-50 hover:text-green-600 hover:border-green-300 flex items-center justify-center gap-1 transition-all">
                              <Plus size={14}/> Add Factor
                           </button>
                        )}
                     </div>
                   );
                 })}
               </div>

               {/* Final Hypothesis (AI Generated) */}
               <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl shadow-sm border border-purple-100 shrink-0 relative overflow-hidden">
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
                    placeholder={isReadOnly ? "No hypothesis generated." : "Start adding factors above to auto-generate the hypothesis..."}
                    value={rootCauseHypothesis}
                  />
               </div>
            </div>
          )}

          {/* TAB 2: FISHBONE */}
          {activeTab === 'fishbone' && (
            <div className="h-full flex flex-col items-center justify-center overflow-x-auto min-h-[500px]">
              <div className="relative w-full max-w-5xl h-[500px] flex items-center bg-white p-8 rounded-xl shadow border">
                 {/* Spine */}
                 <div className="absolute top-1/2 left-10 right-40 h-2 bg-blue-900 z-0"></div>
                 {/* Head */}
                 <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-48 h-32 bg-yellow-400 rounded-[50px] flex items-center justify-center text-center p-4 z-10 border-4 border-blue-900 shadow-lg">
                    <span className="text-sm font-bold text-blue-900 line-clamp-4 leading-tight">{problemStatement || "Problem Statement"}</span>
                 </div>
                 
                 {/* Ribs Container */}
                 <div className="absolute inset-0 right-40 left-10 z-0">
                    {chains.filter(c => c.whys.length > 0).map((chain, idx) => {
                       // Position logic: distribute evenly
                       const activeChains = chains.filter(c => c.whys.length > 0);
                       const total = activeChains.length;
                       const isTop = idx % 2 === 0;
                       const sectionWidth = 100 / Math.ceil(total / 2); 
                       const offset = (Math.floor(idx / 2) * sectionWidth) + (sectionWidth / 2);
                       
                       return (
                         <div 
                           key={chain.category} 
                           className="absolute w-1 h-full"
                           style={{ left: `${offset}%` }}
                         >
                            {/* The Bone Line */}
                            <div className={`absolute left-0 w-1 bg-blue-700 h-1/2 ${isTop ? 'bottom-1/2 origin-bottom -rotate-45' : 'top-1/2 origin-top rotate-45'}`}></div>
                            
                            {/* The Label Box (Category) */}
                            <div 
                              className={`absolute w-40 bg-white border-2 border-blue-800 shadow-md p-2 rounded flex flex-col items-center justify-center z-20 transform -translate-x-1/2
                                ${isTop ? 'top-10' : 'bottom-10'}
                              `}
                            >
                               <div className="font-bold text-xs text-center text-blue-900 w-full uppercase tracking-wide">
                                 {chain.category}
                               </div>
                            </div>

                            {/* Factors List */}
                            <div 
                               className={`absolute w-48 text-[10px] text-gray-600 z-10 p-2 transform -translate-x-1/2
                               ${isTop ? 'top-24 text-center' : 'bottom-24 text-center'}
                               `}
                            >
                               {chain.whys.slice(0, 3).map((w,i) => (
                                  <div key={i} className="bg-white/80 px-1 rounded mb-1 border border-gray-100 shadow-sm truncate">{w}</div>
                               ))}
                               {chain.whys.length > 3 && <div className="text-gray-400 italic">+{chain.whys.length - 3} more...</div>}
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </div>
            </div>
          )}

          {/* TAB 3: PARETO */}
          {activeTab === 'pareto' && (
            <div className="space-y-8 pb-10">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Frequency Input Table */}
                <div className="lg:col-span-4 bg-white p-4 rounded shadow border">
                   <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">1. Enter Frequency</h3>
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
                     {paretoItems.length === 0 && <p className="text-sm text-gray-500 italic">No factors found. Add factors in 'Factor Analysis' tab.</p>}
                   </div>
                </div>

                {/* 2. Calculated Table */}
                <div className="lg:col-span-8 bg-white p-4 rounded shadow border overflow-x-auto">
                   <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">2. Pareto Data Table</h3>
                   <table className="w-full text-sm text-left border-collapse border border-gray-300">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="p-2 border border-gray-300">FACTOR</th>
                          <th className="p-2 border border-gray-300 text-right">FREQUENCY</th>
                          <th className="p-2 border border-gray-300 text-right">TOTAL %</th>
                          <th className="p-2 border border-gray-300 text-right">CUMULATIVE %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paretoData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
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
        </g>

      </g>
    </svg>
  );
};
