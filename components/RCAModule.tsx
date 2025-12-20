
import React, { useState, useEffect, useMemo } from 'react';
import { RCAData, RCAChain, ParetoItem } from '../types';
import { Plus, Trash2, ArrowDown, TrendingUp, Save, X, LayoutGrid, Sparkles, Loader2, GitBranch, Bot, GitFork, BrainCircuit, Share2, BarChart, ChevronDown, ListFilter, Activity, ShieldCheck } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { generateRCAChains } from '../services/aiService';

interface RCANode {
  id: string;
  text: string;
  children: RCANode[];
}

interface RCAModuleProps {
  initialData: RCAData;
  problemStatement: string;
  onSave: (data: RCAData) => void;
  onCancel: () => void;
  isReadOnly: boolean;
}

/**
 * Advanced RCA Module
 * Interactive Flowchart, Branching Ishikawa, and Standard Pareto Analysis
 */
export const RCAModule: React.FC<RCAModuleProps> = ({ initialData, problemStatement, onSave, onCancel, isReadOnly }) => {
  const [tree, setTree] = useState<RCANode[]>([]);
  const [paretoItems, setParetoItems] = useState<ParetoItem[]>(initialData.paretoItems || []);
  const [rootCauseHypothesis, setRootCauseHypothesis] = useState(initialData.rootCauseHypothesis || '');
  const [activeTab, setActiveTab] = useState<'analysis' | 'fishbone' | 'pareto'>('analysis');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAiFillingFactors, setIsAiFillingFactors] = useState(false);

  // --- Tree Conversion Utilities ---
  const chainsToTree = (chains: RCAChain[]): RCANode[] => {
    if (!chains || chains.length === 0) return [];
    const rootNodes: RCANode[] = [];
    chains.forEach(chain => {
      let currentLevel = rootNodes;
      chain.whys.forEach((whyText) => {
        let node = currentLevel.find(n => n.text === whyText);
        if (!node) {
          node = { id: crypto.randomUUID(), text: whyText, children: [] };
          currentLevel.push(node);
        }
        currentLevel = node.children;
      });
    });
    return rootNodes;
  };

  const treeToChains = (nodes: RCANode[]): RCAChain[] => {
    const paths: string[][] = [];
    const traverse = (node: RCANode, currentPath: string[]) => {
      const newPath = [...currentPath, node.text];
      if (node.children.length === 0) {
        paths.push(newPath);
      } else {
        node.children.forEach(child => traverse(child, newPath));
      }
    };
    nodes.forEach(node => traverse(node, []));
    return paths.map(whys => ({ id: crypto.randomUUID(), whys }));
  };

  useEffect(() => {
    const initialTree = chainsToTree(initialData.chains);
    if (initialTree.length === 0 && !isReadOnly) {
      setTree([{ id: crypto.randomUUID(), text: '', children: [] }]);
    } else {
      setTree(initialTree);
    }
  }, []);

  useEffect(() => {
    if (isReadOnly) return;
    const timer = setTimeout(async () => {
      const flatChains = treeToChains(tree);
      const hasFactors = flatChains.some(c => c.whys.some(w => w.trim().length > 0));
      if (!hasFactors) { setRootCauseHypothesis(''); return; }
      setIsAiGenerating(true);
      try {
        let analysisText = "";
        flatChains.forEach(c => {
           const validFactors = c.whys.filter(w => w.trim());
           if (validFactors.length > 0) analysisText += `- ${validFactors.join(' -> ')}\n`;
        });
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Synthesize ONE concise root cause hypothesis sentence for this problem: "${problemStatement}". Causal paths: ${analysisText}. No preamble.`,
        });
        if (response.text) setRootCauseHypothesis(response.text.trim());
      } catch (error) { console.error("AI failed", error); } finally { setIsAiGenerating(false); }
    }, 3000);
    return () => clearTimeout(timer);
  }, [tree, problemStatement, isReadOnly]);

  // Sync Pareto items based on Leaf nodes
  useEffect(() => {
    if (activeTab === 'pareto') {
      const getLeaves = (nodes: RCANode[]): string[] => {
        let leaves: string[] = [];
        nodes.forEach(node => {
          if (node.children.length === 0) {
            if (node.text.trim()) leaves.push(node.text.trim());
          } else {
            leaves = [...leaves, ...getLeaves(node.children)];
          }
        });
        return leaves;
      };
      const currentLeaves = Array.from(new Set(getLeaves(tree)));
      const newItems: ParetoItem[] = currentLeaves.map(leaf => {
        const existing = paretoItems.find(p => p.cause === leaf);
        return { id: crypto.randomUUID(), cause: leaf, frequency: existing ? existing.frequency : 1 };
      });
      setParetoItems(newItems);
    }
  }, [activeTab, tree]);

  const updateNodeText = (id: string, text: string) => {
    const updateRecursive = (nodes: RCANode[]): RCANode[] => nodes.map(node => {
      if (node.id === id) return { ...node, text };
      return { ...node, children: updateRecursive(node.children) };
    });
    setTree(prev => updateRecursive(prev));
  };

  const addChild = (parentId: string) => {
    const addRecursive = (nodes: RCANode[]): RCANode[] => nodes.map(node => {
      if (node.id === parentId) return { ...node, children: [...node.children, { id: crypto.randomUUID(), text: '', children: [] }] };
      return { ...node, children: addRecursive(node.children) };
    });
    setTree(prev => addRecursive(prev));
  };

  const deleteNode = (id: string) => {
    const deleteRecursive = (nodes: RCANode[]): RCANode[] => nodes.filter(node => node.id !== id).map(node => ({
      ...node, children: deleteRecursive(node.children)
    }));
    setTree(prev => {
      const newTree = deleteRecursive(prev);
      return newTree.length === 0 && !isReadOnly ? [{ id: crypto.randomUUID(), text: '', children: [] }] : newTree;
    });
  };

  const handleAutoFillFactors = async () => {
    setIsAiFillingFactors(true);
    const generated = await generateRCAChains(problemStatement);
    const newNodes = chainsToTree(generated.map(whys => ({ id: crypto.randomUUID(), whys })));
    setTree(prev => [...prev.filter(n => n.text.trim() !== ''), ...newNodes]);
    setIsAiFillingFactors(false);
  };

  const handleSave = () => onSave({ chains: treeToChains(tree), paretoItems, rootCauseHypothesis });

  const renderNodes = (nodes: RCANode[], level: number = 0) => (
    <div className="flex gap-8 justify-center items-start">
      {nodes.map((node) => (
        <div key={node.id} className="flex flex-col items-center group">
          <div className={`relative bg-white p-4 rounded-xl border-2 shadow-lg transition-all w-64 ${node.text.trim() ? 'border-blue-200 hover:border-blue-400' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Why? Lvl {level + 1}</span>
              {!isReadOnly && (
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => addChild(node.id)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><GitFork size={12}/></button>
                  <button onClick={() => deleteNode(node.id)} className="text-red-400 hover:bg-red-50 p-1 rounded"><Trash2 size={12}/></button>
                </div>
              )}
            </div>
            <textarea 
              disabled={isReadOnly} rows={3} value={node.text}
              onChange={(e) => updateNodeText(node.id, e.target.value)}
              className="w-full p-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-gray-800 resize-none font-medium leading-relaxed"
              placeholder="Identify cause..."
            />
          </div>
          {node.children.length > 0 && (
            <>
              <div className="h-8 w-0.5 bg-blue-300"></div>
              {node.children.length > 1 && <div className="w-full flex items-center px-4 -mt-0.5 mb-8"><div className="h-0.5 flex-1 bg-blue-300"></div><div className="h-0.5 flex-1 bg-blue-300"></div></div>}
              <div className={`flex gap-8 ${node.children.length > 1 ? '-mt-8' : ''}`}>{renderNodes(node.children, level + 1)}</div>
            </>
          )}
          {node.children.length === 0 && !isReadOnly && (
             <button onClick={() => addChild(node.id)} className="mt-4 w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"><Plus size={16}/></button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-7xl h-[95vh] rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-[#007530] text-white p-5 flex justify-between items-center shrink-0 shadow-xl relative z-30">
          <div className="flex items-center gap-4">
             <div className="bg-white/20 p-2.5 rounded-2xl"><BrainCircuit size={32} className="text-yellow-300 animate-pulse"/></div>
             <div>
               <h2 className="text-2xl font-black tracking-tight">Root Cause Analysis Suite</h2>
               <p className="text-xs text-green-100 font-bold opacity-80 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> ISO 9001:2015 Diagnostic Engine</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            {!isReadOnly && activeTab === 'analysis' && (
              <button onClick={handleAutoFillFactors} disabled={isAiFillingFactors} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold inline-flex items-center gap-2 shadow-lg transition-all active:scale-95">
                {isAiFillingFactors ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />} AI Assist
              </button>
            )}
            {!isReadOnly && <button onClick={handleSave} className="bg-yellow-500 hover:bg-yellow-600 text-green-900 px-6 py-2.5 rounded-xl font-extrabold flex items-center gap-2 shadow-lg active:scale-95"><Save size={18}/> Save Analysis</button>}
            <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-colors">Close</button>
          </div>
        </div>

        <div className="flex bg-gray-50 border-b border-gray-200 shrink-0 px-4 relative z-20">
          <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<Activity size={18}/>} label="Flowchart (5 Whys)"/>
          <TabButton active={activeTab === 'fishbone'} onClick={() => setActiveTab('fishbone')} icon={<GitBranch size={18}/>} label="Ishikawa Diagram"/>
          <TabButton active={activeTab === 'pareto'} onClick={() => setActiveTab('pareto')} icon={<BarChart size={18}/>} label="Pareto Analysis"/>
        </div>

        <div className="flex-1 overflow-hidden bg-[#f8fafc] flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {activeTab === 'analysis' && (
              <div className="space-y-12">
                 <div className="flex flex-col items-center">
                    <div className="bg-red-600 text-white p-4 rounded-3xl shadow-2xl border-4 border-red-400/50 max-w-xl w-full text-center relative hover:scale-[1.02] transition-transform">
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">Main Problem</div>
                       <p className="text-sm font-bold leading-relaxed italic">"{problemStatement}"</p>
                    </div>
                    <div className="h-12 w-1 bg-gradient-to-b from-red-400 to-blue-400"></div>
                 </div>
                 <div className="flex justify-center -mt-6 mb-6">
                    {!isReadOnly && (
                      <button onClick={() => setTree([...tree, { id: crypto.randomUUID(), text: '', children: [] }])} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-black shadow-xl flex items-center gap-2 group active:scale-95 transition-all">
                        <Plus size={16} className="group-hover:rotate-90 transition-transform"/> New Path from Root
                      </button>
                    )}
                 </div>
                 <div className="w-full flex justify-center pb-24">{renderNodes(tree)}</div>
                 <div className="bg-white p-4 rounded-xl border-2 border-indigo-50 shadow-md relative overflow-hidden mt-6 border-l-4 border-l-indigo-600 max-w-4xl mx-auto">
                    <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none"><BrainCircuit size={60} className="text-indigo-900"/></div>
                    <div className="flex justify-between items-center mb-3 relative z-10">
                       <h3 className="font-bold text-indigo-950 text-base flex items-center gap-2"><Sparkles size={18} className="text-indigo-600 animate-pulse"/> Synthesized Root Cause Hypothesis</h3>
                       {isAiGenerating && <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-50 rounded-full text-[9px] font-black text-indigo-600 border border-indigo-100 shadow-sm"><Loader2 size={10} className="animate-spin"/> AI ANALYZING...</div>}
                    </div>
                    <textarea readOnly className="w-full p-3 border border-indigo-50 bg-indigo-50/10 rounded-lg text-gray-800 font-semibold text-sm italic resize-none outline-none leading-relaxed" rows={2} value={rootCauseHypothesis} placeholder="Calculated automatically from your analysis..." />
                 </div>
              </div>
            )}

            {activeTab === 'fishbone' && (
               <div className="h-full flex flex-col items-center justify-center p-4">
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-100 w-full overflow-hidden relative">
                      <h3 className="text-center font-black text-gray-800 text-2xl mb-8 uppercase tracking-widest">Ishikawa Diagram</h3>
                      <div className="w-full aspect-[21/9]"><FishboneChart tree={tree} problem={problemStatement} /></div>
                  </div>
               </div>
            )}

            {activeTab === 'pareto' && (
              <div className="h-full flex flex-col gap-8">
                 <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-10 left-10"><h3 className="font-black text-gray-400 text-4xl uppercase tracking-tighter opacity-10">PARETO CHART</h3></div>
                    <div className="w-full h-[400px] mb-12"><ParetoSVG data={paretoItems} /></div>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
                    <h3 className="font-black text-gray-800 text-xl mb-6 uppercase tracking-wider">PARETO TABLE</h3>
                    <ParetoTable data={paretoItems} isReadOnly={isReadOnly} onFreqChange={(id, val) => setParetoItems(prev => prev.map(p => p.id === id ? { ...p, frequency: val } : p))} />
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-10 py-5 text-sm font-black transition-all border-b-4 ${active ? 'border-[#007530] text-[#007530] bg-white' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
    {icon}<span className="uppercase tracking-widest">{label}</span>
  </button>
);

const FishboneChart = ({ tree, problem }: { tree: RCANode[], problem: string }) => {
   const ribsCount = Math.max(tree.length, 4);
   const renderSubFactors = (node: RCANode, xBase: number, yBase: number, isTop: boolean, depth: number) => {
      return (node.children || []).map((child, j) => {
         const offset = (j + 1) * (35 / (depth + 1));
         const x = xBase + (offset * 0.6);
         const y = isTop ? yBase + offset : yBase - offset;
         return (
            <g key={child.id}>
               <line x1={x} y1={y} x2={x + 50} y2={y} stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
               <foreignObject x={x + 2} y={isTop ? y - 18 : y + 2} width="110" height="40" className="overflow-visible">
                 <div className="text-[7px] font-bold text-slate-700 leading-none p-1 bg-white/60 rounded backdrop-blur-sm break-words whitespace-normal" style={{ maxWidth: '100px' }}>
                    {child.text}
                 </div>
               </foreignObject>
               {renderSubFactors(child, x, y, isTop, depth + 1)}
            </g>
         );
      });
   };

   return (
     <svg viewBox="0 0 1000 450" className="w-full h-full drop-shadow-lg font-sans overflow-visible">
        <line x1="50" y1="225" x2="780" y2="225" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" markerEnd="url(#fish-arrow-main)" />
        <defs>
           <marker id="fish-arrow-main" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#1e293b" /></marker>
        </defs>
        <rect x="780" y="140" width="210" height="170" fill="#fee2e2" stroke="#ef4444" strokeWidth="3" rx="12" />
        <foreignObject x="790" y="150" width="190" height="150">
           <div className="h-full w-full flex items-center justify-center text-center p-3 overflow-y-auto custom-scrollbar"><p className="text-[11px] font-black text-red-900 leading-tight uppercase">{problem}</p></div>
        </foreignObject>
        {tree.map((node, i) => {
           const isTop = i % 2 === 0;
           const spacing = ribsCount > 1 ? 650 / (Math.ceil(ribsCount / 2)) : 650;
           const xPos = 80 + (Math.floor(i/2)) * spacing;
           const ribEnd = isTop ? 40 : 410;
           return (
              <g key={node.id}>
                 <line x1={xPos} y1={ribEnd} x2={xPos + 100} y2="225" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                 <foreignObject x={xPos - 50} y={isTop ? ribEnd - 30 : ribEnd + 5} width="150" height="40" className="overflow-visible">
                    <div className="text-[9px] font-black text-slate-800 text-center uppercase break-words bg-slate-100/80 px-2 py-1 rounded border border-slate-300">{node.text}</div>
                 </foreignObject>
                 {renderSubFactors(node, xPos, ribEnd, isTop, 0)}
              </g>
           );
        })}
     </svg>
   );
};

const ParetoSVG = ({ data }: { data: ParetoItem[] }) => {
   const sorted = useMemo(() => [...data].sort((a, b) => b.frequency - a.frequency), [data]);
   const total = sorted.reduce((sum, item) => sum + item.frequency, 0) || 1;
   const width = 800; const height = 400; const margin = { top: 40, right: 80, bottom: 80, left: 80 };
   const chartWidth = width - margin.left - margin.right; const chartHeight = height - margin.top - margin.bottom;
   if (total <= 1 && sorted.length === 0) return <div className="h-full flex items-center justify-center text-gray-300 font-black uppercase">No Causes Found</div>;
   const maxFreq = Math.max(...sorted.map(i => i.frequency), 1);
   const barWidth = chartWidth / (sorted.length || 1);
   let cumulative = 0;
   const points = sorted.map((item, i) => {
      cumulative += item.frequency;
      const x = margin.left + (i * barWidth) + (barWidth / 2);
      const y = margin.top + chartHeight - (cumulative / total) * chartHeight;
      return { x, y, percent: (cumulative / total) * 100 };
   });
   const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
   return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none font-sans overflow-visible">
         {[0, 0.25, 0.5, 0.75, 1].map(p => (
            <React.Fragment key={p}>
               <line x1={margin.left} y1={margin.top + chartHeight * p} x2={margin.left + chartWidth} y2={margin.top + chartHeight * p} stroke="#e2e8f0" strokeWidth="1" />
               <text x={margin.left - 10} y={margin.top + chartHeight * (1-p) + 4} textAnchor="end" fontSize="10" fill="#64748b" fontWeight="bold">{(maxFreq * p).toFixed(1)}</text>
               <text x={margin.left + chartWidth + 10} y={margin.top + chartHeight * (1-p) + 4} textAnchor="start" fontSize="10" fill="#64748b" fontWeight="bold">{Math.round(p * 100)}.00%</text>
            </React.Fragment>
         ))}
         <text x={width/2} y={height - 10} textAnchor="middle" fontSize="12" fontWeight="black" fill="#475569" className="uppercase tracking-widest">PROBLEM</text>
         {sorted.map((item, i) => {
            const h = (item.frequency / maxFreq) * chartHeight;
            return (
               <g key={i}>
                  <rect x={margin.left + i * barWidth + 4} y={margin.top + chartHeight - h} width={barWidth - 8} height={h} fill="#4285f4" />
                  <text x={margin.left + i * barWidth + barWidth/2} y={margin.top + chartHeight + 20} textAnchor="middle" fontSize="12" fontWeight="900" fill="#334155">{labels[i] || '?'}</text>
               </g>
            );
         })}
         <path d={`M ${margin.left + barWidth/2},${margin.top + chartHeight - (sorted[0].frequency / total * chartHeight)} ${points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}`} fill="none" stroke="#ea4335" strokeWidth="3" />
         {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ea4335" stroke="white" strokeWidth="2" />)}
         <div className="flex gap-4 absolute top-0 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#4285f4]"></div><span className="text-[10px] font-bold uppercase">FREQUENCY</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-1 bg-[#ea4335]"></div><span className="text-[10px] font-bold uppercase">CUMULATIVE%</span></div>
         </div>
      </svg>
   );
};

const ParetoTable = ({ data, isReadOnly, onFreqChange }: { data: ParetoItem[], isReadOnly: boolean, onFreqChange: (id: string, val: number) => void }) => {
   const sorted = useMemo(() => [...data].sort((a, b) => b.frequency - a.frequency), [data]);
   const totalFreq = sorted.reduce((sum, item) => sum + item.frequency, 0) || 1;
   const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
   let cumulative = 0;
   return (
      <div className="overflow-hidden border border-gray-300 rounded-lg">
         <table className="w-full text-sm text-left border-collapse bg-slate-50">
            <thead>
               <tr className="bg-gray-100 border-b border-gray-300">
                  <th colSpan={2} className="p-3 border-r border-gray-300 text-center font-black uppercase">PROBLEM</th>
                  <th className="p-3 border-r border-gray-300 text-center font-black uppercase w-32">FREQUENCY</th>
                  <th className="p-3 border-r border-gray-300 text-center font-black uppercase w-32">TOTAL%</th>
                  <th className="p-3 text-center font-black uppercase w-32">CUMULATIVE%</th>
               </tr>
            </thead>
            <tbody>
               {sorted.map((item, i) => {
                  cumulative += item.frequency;
                  const totalPct = (item.frequency / totalFreq) * 100;
                  const cumPct = (cumulative / totalFreq) * 100;
                  return (
                     <tr key={item.id} className="border-b border-gray-300 bg-white hover:bg-slate-50 transition-colors">
                        <td className="p-3 border-r border-gray-300 font-black text-center w-12">{labels[i] || '?'}</td>
                        <td className="p-3 border-r border-gray-300 font-medium">{item.cause}</td>
                        <td className="p-3 border-r border-gray-300 text-center">
                           <input type="number" disabled={isReadOnly} className="w-20 p-1 bg-white border border-gray-200 rounded text-center font-black text-blue-600 outline-none focus:ring-1 focus:ring-blue-500" value={item.frequency} onChange={e => onFreqChange(item.id, parseInt(e.target.value) || 0)} />
                        </td>
                        <td className="p-3 border-r border-gray-300 text-center font-bold text-slate-600">{totalPct.toFixed(2)}%</td>
                        <td className="p-3 text-center font-bold text-slate-600">{cumPct.toFixed(2)}%</td>
                     </tr>
                  );
               })}
               <tr className="bg-gray-100 font-black">
                  <td colSpan={2} className="p-3 border-r border-gray-300 text-center uppercase tracking-tighter">TOTAL</td>
                  <td className="p-3 border-r border-gray-300 text-center">{totalFreq}</td>
                  <td className="p-3 border-r border-gray-300 text-center">100.00%</td>
                  <td className="p-3 text-center">100.00%</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
};
