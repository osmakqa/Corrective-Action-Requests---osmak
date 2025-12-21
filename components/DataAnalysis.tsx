import React, { useState, useEffect, useMemo } from 'react';
import { fetchCARs } from '../services/store';
import { CAR, DEPARTMENTS, Role, CARStatus } from '../types';
import { BarChart2, Calendar, Filter, Award, PieChart, Download, Loader2, Circle, Clock, CheckCircle, Archive, AlertOctagon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DataAnalysisProps {
    userRole?: Role;
    userDepartment?: string;
}

export const DataAnalysis: React.FC<DataAnalysisProps> = ({ userRole, userDepartment }) => {
  const [cars, setCars] = useState<CAR[]>([]);
  const [filteredCars, setFilteredCars] = useState<CAR[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Sorting States
  const [isoSortConfig, setIsoSortConfig] = useState<{ key: 'label' | 'count'; direction: 'asc' | 'desc' } | null>({ key: 'count', direction: 'desc' });
  const [matrixSortConfig, setMatrixSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'Total', direction: 'desc' });

  const isSectionUser = userRole === Role.SECTION;

  useEffect(() => {
    const loadData = async () => {
      let allCars = await fetchCARs();
      if (isSectionUser && userDepartment) {
          allCars = allCars.filter(c => c.department === userDepartment);
          setSelectedDept(userDepartment);
      }
      setCars(allCars);
      setLoading(false);
    };
    loadData();
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    setStartDate(startOfYear.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [userRole, userDepartment, isSectionUser]);

  useEffect(() => {
    let result = cars;
    if (startDate) result = result.filter(c => c.dateIssued >= startDate);
    if (endDate) result = result.filter(c => c.dateIssued <= endDate);
    setFilteredCars(result);
  }, [cars, startDate, endDate]);

  const handleSortIso = (key: 'label' | 'count') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (isoSortConfig && isoSortConfig.key === key && isoSortConfig.direction === 'asc') direction = 'desc';
    setIsoSortConfig({ key, direction });
  };

  const handleSortMatrix = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (matrixSortConfig && matrixSortConfig.key === key && matrixSortConfig.direction === 'asc') direction = 'desc';
    setMatrixSortConfig({ key, direction });
  };

  const SortIndicator = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
    if (!active) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-green-600" /> : <ArrowDown size={12} className="ml-1 text-green-600" />;
  };

  // --- KPI Calculations ---
  const respondedCars = filteredCars.filter(c => c.dateResponseSubmitted && c.dateIssued);
  const totalResponseDays = respondedCars.reduce((sum, c) => {
      const issued = new Date(c.dateIssued).getTime();
      const responded = new Date(c.dateResponseSubmitted!).getTime();
      const diffTime = responded - issued;
      return sum + Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, 0);
  const avgResponseTime = respondedCars.length > 0 ? (totalResponseDays / respondedCars.length).toFixed(1) : "0";

  const verifiedCars = filteredCars.filter(c => [CARStatus.VERIFIED, CARStatus.CLOSED, CARStatus.INEFFECTIVE].includes(c.status));
  const effectiveCount = verifiedCars.filter(c => c.isEffective).length;
  const effectivenessRate = verifiedCars.length > 0 ? ((effectiveCount / verifiedCars.length) * 100).toFixed(0) : "0";

  const closedCount = filteredCars.filter(c => c.status === CARStatus.CLOSED).length;
  const lateCount = filteredCars.filter(c => c.isLate).length;

  // --- Processed Data with Sorting ---
  const sortedIsoData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCars.forEach(c => {
      const key = c.description.reference || "Unspecified";
      const codeMatch = key.match(/Clause\s+([\d\.]+)/);
      const shortKey = codeMatch ? `Clause ${codeMatch[1]}` : (key.length > 30 ? key.substring(0, 30) + '...' : key);
      counts[shortKey] = (counts[shortKey] || 0) + 1;
    });
    
    let entries = Object.entries(counts).map(([label, count]) => ({ label, count }));
    if (isoSortConfig) {
      entries.sort((a, b) => {
        const valA = a[isoSortConfig.key];
        const valB = b[isoSortConfig.key];
        if (valA < valB) return isoSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return isoSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return entries.slice(0, 10);
  }, [filteredCars, isoSortConfig]);

  const sortedMatrixRows = useMemo(() => {
    const matrix: Record<string, any> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const activeMatrixCars = (selectedDept === 'All' || isSectionUser) ? filteredCars : filteredCars.filter(c => c.department === selectedDept);

    activeMatrixCars.forEach(c => {
      const date = new Date(c.dateIssued);
      const monthKey = months[date.getMonth()];
      const key = c.description.reference || "Unspecified";
      const codeMatch = key.match(/Clause\s+([\d\.]+)/);
      const shortKey = codeMatch ? `Clause ${codeMatch[1]}` : (key.length > 20 ? key.substring(0, 20) + '...' : key);

      if (!matrix[shortKey]) {
        matrix[shortKey] = { Clause: shortKey, Total: 0 };
        months.forEach(m => matrix[shortKey][m] = 0);
      }
      matrix[shortKey][monthKey]++;
      matrix[shortKey].Total++;
    });

    let rows = Object.values(matrix);
    if (matrixSortConfig) {
      rows.sort((a, b) => {
        const valA = a[matrixSortConfig.key] || 0;
        const valB = b[matrixSortConfig.key] || 0;
        if (valA < valB) return matrixSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return matrixSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [filteredCars, selectedDept, matrixSortConfig]);

  const sourceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredCars.forEach(c => counts[c.source || "Unknown"] = (counts[c.source || "Unknown"] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredCars]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-green-700" size={48} /></div>;

  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
             <PieChart className="text-green-600"/> Data Analysis & Analytics {isSectionUser && `(${userDepartment})`}
           </h2>
           <p className="text-sm text-gray-500">Performance and trend tracking.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
             <input type="date" className="text-xs border rounded p-1 bg-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
           </div>
           <div className="flex items-center gap-2 border-l pl-2">
             <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
             <input type="date" className="text-xs border rounded p-1 bg-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Response', value: `${avgResponseTime} d`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Effectiveness', value: `${effectivenessRate}%`, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Closed CARs', value: closedCount, icon: Archive, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Late Responses', value: lateCount, icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow border border-gray-100 flex items-center justify-between">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p><p className={`text-2xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p></div>
            <div className={`${kpi.bg} p-3 rounded-full ${kpi.color}`}><kpi.icon size={20}/></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
           <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2 uppercase tracking-wide">
             <BarChart2 size={16} className="text-blue-600"/> Top 10 ISO Non-Conformities
           </h3>
           <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold">
                  <tr>
                    <th className="p-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSortIso('label')}>
                      <div className="flex items-center">ISO Reference <SortIndicator active={isoSortConfig?.key === 'label'} direction={isoSortConfig?.direction || 'asc'} /></div>
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSortIso('count')}>
                      <div className="flex items-center justify-end">Count <SortIndicator active={isoSortConfig?.key === 'count'} direction={isoSortConfig?.direction || 'asc'} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedIsoData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 group">
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800">{item.label}</span>
                          <div className="w-full bg-gray-100 rounded-full h-1">
                            <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${(item.count / (filteredCars.length || 1)) * 100}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
           <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2 uppercase tracking-wide">
             <PieChart size={16} className="text-teal-600"/> Source Analytics
           </h3>
           <div className="space-y-4">
              {sourceDistribution.map(([label, count], i) => (
                <div key={label} className="flex items-center gap-4">
                   <div className="w-24 text-[10px] font-bold text-gray-500 truncate" title={label}>{label}</div>
                   <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden relative">
                      <div className="bg-teal-500 h-full transition-all" style={{ width: `${(count / (filteredCars.length || 1)) * 100}%` }}></div>
                   </div>
                   <div className="w-8 text-xs font-bold text-teal-700 text-right">{count}</div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Calendar size={16} className="text-orange-600"/> Monthly Trend Analysis Matrix
            </h3>
            {!isSectionUser && (
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="text-xs border rounded-lg p-2 bg-gray-50 font-bold focus:ring-2 focus:ring-green-500 outline-none">
                 <option value="All">All Sections</option>
                 {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
         </div>
         
         <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full text-[10px] text-left border-collapse">
               <thead className="bg-gray-100 text-gray-600 font-bold uppercase">
                  <tr>
                     <th className="p-3 border-b border-gray-200 sticky left-0 bg-gray-100 z-10 cursor-pointer hover:bg-gray-200" onClick={() => handleSortMatrix('Clause')}>
                        <div className="flex items-center">ISO Clause <SortIndicator active={matrixSortConfig?.key === 'Clause'} direction={matrixSortConfig?.direction || 'asc'} /></div>
                     </th>
                     {monthsList.map(m => (
                        <th key={m} className="p-3 border-b border-gray-200 text-center w-12 cursor-pointer hover:bg-gray-200" onClick={() => handleSortMatrix(m)}>
                           <div className="flex flex-col items-center">{m} <SortIndicator active={matrixSortConfig?.key === m} direction={matrixSortConfig?.direction || 'asc'} /></div>
                        </th>
                     ))}
                     <th className="p-3 border-b border-gray-200 text-center font-bold bg-gray-200 cursor-pointer hover:bg-gray-300" onClick={() => handleSortMatrix('Total')}>
                        <div className="flex items-center justify-center">Total <SortIndicator active={matrixSortConfig?.key === 'Total'} direction={matrixSortConfig?.direction || 'asc'} /></div>
                     </th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {sortedMatrixRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                       <td className="p-3 font-bold text-gray-800 sticky left-0 bg-white border-r border-gray-100">{row.Clause}</td>
                       {monthsList.map(m => (
                          <td key={m} className={`p-3 text-center border-l border-gray-50 ${row[m] > 0 ? 'bg-orange-50 font-bold text-orange-700' : 'text-gray-300'}`}>
                             {row[m] > 0 ? row[m] : '0'}
                          </td>
                       ))}
                       <td className="p-3 text-center font-extrabold bg-gray-50 text-gray-900 border-l border-gray-200">{row.Total}</td>
                    </tr>
                  ))}
                  {sortedMatrixRows.length === 0 && <tr><td colSpan={14} className="p-8 text-center text-gray-400 italic">No data found for this selection.</td></tr>}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};