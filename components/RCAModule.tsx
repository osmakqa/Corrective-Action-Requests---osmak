import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RCAData, RCAChain, ParetoItem } from '../types';
// @fix: Removed duplicate ArrowDown identifier from the import list.
import { Plus, Trash2, TrendingUp, Save, X, LayoutGrid, Sparkles, AlertCircle, Loader2, GitBranch, Bot, ArrowDown, ChevronDown, Split, BrainCircuit, Printer, ArrowUpDown, ArrowUp } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generateRCAChains } from '../services/aiService';

interface RCAModuleProps {
  initialData: RCAData;
  problemStatement: string;
  refNo?: string;
  carNo?: string;
  onSave: (data: RCAData) => void;
  onCancel: () => void;
  isReadOnly: boolean;
}

export const RCAModule: React.FC<RCAModuleProps> = ({ initialData, problemStatement, refNo, carNo, onSave, onCancel, isReadOnly }) => {
  const [chains, setChains] = useState<RCAChain[]>(initialData.chains || []);
  const [paretoItems, setParetoItems] = useState<ParetoItem[]>(initialData.paretoItems || []);
  const [rootCauseHypothesis, setRootCauseHypothesis] = useState(initialData.rootCauseHypothesis || '');
  const [activeTab, setActiveTab] = useState<'analysis' | 'fishbone' | 'pareto'>('analysis');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiFillingFactors, setIsAiFillingFactors] = useState(false);
  
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Pareto Sorting State
  const [paretoSortConfig, setParetoSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (chains.length === 0 && !isReadOnly) {
      setChains([{ id: crypto.randomUUID(), whys: [''] }]);
    }
  }, [isReadOnly, chains.length]);

  const handleSynthesizeHypothesis = async () => {
    const hasFactors = chains.some(c => c.whys.some(w => w.trim().length > 0));
    if (!hasFactors) { alert("Please enter some causal factors."); return; }
    setIsAiGenerating(true);
    try {
      let analysisText = "";
      chains.forEach(c => {
         const validFactors = c.whys.filter(w => w.trim());
         if (validFactors.length > 0) analysisText += `- Chain: ${validFactors.join(' -> caused -> ')}\n`;
      });
      const prompt = `Synthesize a root cause hypothesis based on these chains: ${analysisText}. Problem: ${problemStatement}`;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (response.text) setRootCauseHypothesis(response.text.trim());
    } catch (error) { console.error("AI failed", error); } finally { setIsAiGenerating(false); }
  };

  const handleAutoFillFactors = async () => {
    setIsAiFillingFactors(true);
    const generatedChains = await generateRCAChains(problemStatement);
    setChains(prev => [...prev, ...generatedChains.map(whys => ({ id: crypto.randomUUID(), whys }))]);
    setIsAiFillingFactors(false);
  };

  const updateWhy = (chainId: string, index: number, value: string) => {
    setChains(prev => prev.map(c => c.id === chainId ? { ...c, whys: c.whys.map((w, i) => i === index ? value : w) } : c));
  };

  useEffect(() => {
    if (activeTab === 'pareto') {
      const potentialRootCauses: {id: string, cause: string}[] = [];
      chains.forEach(chain => {
        const validWhys = chain.whys.filter(w => w.trim());
        if (validWhys.length > 0) potentialRootCauses.push({ id: chain.id, cause: validWhys[validWhys.length - 1] });
      });
      setParetoItems(potentialRootCauses.map(f => {
        const existing = paretoItems.find(p => p.cause === f.cause);
        return { id: f.id, cause: f.cause, frequency: existing ? existing.frequency : 0 };
      }));
    }
  }, [activeTab, chains]);

  const handleFrequencyChange = (cause: string, freq: number) => {
    setParetoItems(prev => prev.map(p => p.cause === cause ? { ...p, frequency: freq } : p));
  };

  const handleSortPareto = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (paretoSortConfig && paretoSortConfig.key === key && paretoSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setParetoSortConfig({ key, direction });
  };

  const ParetoSortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (!paretoSortConfig || paretoSortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return paretoSortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-green-600" /> : <ArrowDown size={12} className="ml-1 text-green-600" />;
  };

  const totalFrequency = useMemo(() => paretoItems.reduce((sum, item) => sum + item.frequency, 0), [paretoItems]);
  
  const processedParetoData = useMemo(() => {
    // 1. Initial sorting by frequency descending as per Pareto chart requirement
    const sortedByFreq = [...paretoItems].sort((a, b) => b.frequency - a.frequency);
    let runningCum = 0;
    const itemsWithStats = sortedByFreq.map(item => {
      const percent = totalFrequency === 0 ? 0 : (item.frequency / totalFrequency) * 100;
      runningCum += percent;
      return { ...item, percent, cumulative: runningCum };
    });

    // 2. Apply UI sorting if configured
    if (paretoSortConfig) {
      itemsWithStats.sort((a, b) => {
        let aValue: any = (a as any)[paretoSortConfig.key];
        let bValue: any = (b as any)[paretoSortConfig.key];
        if (aValue < bValue) return paretoSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return paretoSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return itemsWithStats;
  }, [paretoItems, totalFrequency, paretoSortConfig]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:static print:block overflow-hidden">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-xl flex flex-col shadow-2xl overflow-hidden print:h-auto">
        <style dangerouslySetInnerHTML={{ __html: `@media print { @page { size: A4 portrait; margin: 15mm; } .no-print { display: none !important; } .print-only { display: block !important; } }` }} />

        {/* Header */}
        <div className="bg-green-800 text-white p-4 flex justify-between items-center shrink-0 no-print">
          <div><h2 className="text-xl font-bold flex items-center gap-2">AI Root Cause Analysis</h2></div>
          <div className="flex gap-2">
            {!isReadOnly && (<button onClick={() => onSave({ chains, paretoItems, rootCauseHypothesis })} className="bg-yellow-500 px-4 py-2 rounded-lg font-bold">Save</button>)}
            <button onClick={() => window.print()} className="bg-blue-600 px-4 py-2 rounded-lg font-bold">Print</button>
            <button onClick={onCancel} className="bg-white/10 px-4 py-2 rounded-lg font-bold">Close</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-50 border-b no-print">
          <button onClick={() => setActiveTab('analysis')} className={`px-6 py-3 ${activeTab === 'analysis' ? 'bg-white font-bold' : ''}`}>5 Whys</button>
          <button onClick={() => setActiveTab('fishbone')} className={`px-6 py-3 ${activeTab === 'fishbone' ? 'bg-white font-bold' : ''}`}>Fishbone</button>
          <button onClick={() => setActiveTab('pareto')} className={`px-6 py-3 ${activeTab === 'pareto' ? 'bg-white font-bold' : ''}`}>Pareto</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] no-print">
          {activeTab === 'pareto' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded shadow border">
                  <h3 className="font-bold mb-4">Frequencies</h3>
                  {paretoItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 py-2 border-b">
                      <div className="flex-1 text-sm">{item.cause}</div>
                      <input type="number" disabled={isReadOnly} className="w-20 border rounded p-1 text-right" value={item.frequency} onChange={(e) => handleFrequencyChange(item.cause, parseInt(e.target.value) || 0)} />
                    </div>
                  ))}
                </div>

                <div className="bg-white p-4 rounded shadow border overflow-x-auto">
                   <h3 className="font-bold mb-4">Statistical Prioritization</h3>
                   <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-gray-100 font-bold">
                        <tr>
                          <th className="p-2 border cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSortPareto('cause')}>
                            <div className="flex items-center">Root Cause <ParetoSortIndicator columnKey="cause" /></div>
                          </th>
                          <th className="p-2 border cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSortPareto('frequency')}>
                            <div className="flex items-center justify-center">Frequency <ParetoSortIndicator columnKey="frequency" /></div>
                          </th>
                          <th className="p-2 border cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSortPareto('cumulative')}>
                            <div className="flex items-center justify-center">Cumulative % <ParetoSortIndicator columnKey="cumulative" /></div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedParetoData.map((row, idx) => (
                          <tr key={idx} className={row.cumulative <= 80 ? 'bg-blue-50' : ''}>
                             <td className="p-2 border">{row.cause}</td>
                             <td className="p-2 border text-center">{row.frequency}</td>
                             <td className="p-2 border text-center font-bold text-blue-700">{row.cumulative.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-4 p-4">
              <p className="text-sm italic mb-4">Conduct 5 Whys Analysis below by adding causal chains...</p>
              {chains.map(chain => (
                <div key={chain.id} className="p-4 bg-white border rounded shadow-sm mb-4">
                   <div className="font-bold text-xs text-gray-400 mb-2 uppercase">Causal Chain</div>
                   {chain.whys.map((w, idx) => (
                     <div key={idx} className="mb-2">
                       <input 
                         disabled={isReadOnly}
                         className="w-full p-2 border border-gray-200 rounded text-sm bg-gray-50 focus:bg-white" 
                         value={w} 
                         onChange={e => updateWhy(chain.id, idx, e.target.value)} 
                         placeholder={`Why level ${idx+1}`} 
                       />
                     </div>
                   ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
