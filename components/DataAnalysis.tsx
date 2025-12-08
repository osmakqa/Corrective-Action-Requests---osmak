import React, { useState, useEffect } from 'react';
import { fetchCARs } from '../services/store';
import { CAR, DEPARTMENTS, Role, CARStatus } from '../types';
import { BarChart2, Calendar, Filter, Award, PieChart, Download, Loader2, Circle, Clock, CheckCircle, Archive, AlertOctagon } from 'lucide-react';

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

  const isSectionUser = userRole === Role.SECTION;

  useEffect(() => {
    const loadData = async () => {
      let allCars = await fetchCARs();
      
      // If Section User, strictly filter to their department immediately
      if (isSectionUser && userDepartment) {
          allCars = allCars.filter(c => c.department === userDepartment);
          setSelectedDept(userDepartment); // Force select department dropdown
      }

      setCars(allCars);
      setLoading(false);
    };
    
    loadData();
    
    // Set defaults: Start of current year to today
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    setStartDate(startOfYear.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [userRole, userDepartment, isSectionUser]);

  useEffect(() => {
    let result = cars;

    // Date Filter
    if (startDate) {
      result = result.filter(c => c.dateIssued >= startDate);
    }
    if (endDate) {
      result = result.filter(c => c.dateIssued <= endDate);
    }

    setFilteredCars(result);
  }, [cars, startDate, endDate]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-green-700" size={48} /></div>;
  }

  // --- KPI Metrics Calculations ---

  // 1. Average Response Time
  const respondedCars = filteredCars.filter(c => c.dateResponseSubmitted && c.dateIssued);
  const totalResponseDays = respondedCars.reduce((sum, c) => {
      const issued = new Date(c.dateIssued).getTime();
      const responded = new Date(c.dateResponseSubmitted!).getTime();
      const diffTime = responded - issued;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, diffDays); // Ensure non-negative
  }, 0);
  const avgResponseTime = respondedCars.length > 0 ? (totalResponseDays / respondedCars.length).toFixed(1) : "0";

  // 2. Effectiveness Rate
  const verifiedCars = filteredCars.filter(c => 
     c.status === CARStatus.VERIFIED || 
     c.status === CARStatus.CLOSED || 
     c.status === CARStatus.INEFFECTIVE
  );
  const effectiveCount = verifiedCars.filter(c => c.isEffective).length;
  const effectivenessRate = verifiedCars.length > 0 ? ((effectiveCount / verifiedCars.length) * 100).toFixed(0) : "0";

  // 3. Closed CARs
  const closedCount = filteredCars.filter(c => c.status === CARStatus.CLOSED).length;

  // 4. Late Submissions
  const lateCount = filteredCars.filter(c => c.isLate).length;


  // --- Aggregation Logic ---

  // 1. Most Common ISO Clauses
  const isoCounts: Record<string, number> = {};
  filteredCars.forEach(c => {
    const key = c.description.reference || "Unspecified";
    const codeMatch = key.match(/Clause\s+([\d\.]+)/);
    const shortKey = codeMatch ? `Clause ${codeMatch[1]}` : (key.length > 30 ? key.substring(0, 30) + '...' : key);
    isoCounts[shortKey] = (isoCounts[shortKey] || 0) + 1;
  });
  
  const sortedIso = Object.entries(isoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10

  // 2. CARs per Section (Only useful for QA, but kept for logic consistency)
  const deptCounts: Record<string, number> = {};
  filteredCars.forEach(c => {
    deptCounts[c.department] = (deptCounts[c.department] || 0) + 1;
  });
  const sortedDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

  // 3. Top Sections (Fewest CARs) - QA View Only
  const allDeptStats = DEPARTMENTS.map(dept => ({
    name: dept,
    count: deptCounts[dept] || 0
  })).sort((a, b) => a.count - b.count);
  const topSections = allDeptStats.slice(0, 5);

  // 4. Source Distribution
  const sourceCounts: Record<string, number> = {};
  filteredCars.forEach(c => {
    const src = c.source || "Unknown";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sortedSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);

  // 5. Matrix: ISO (Rows) vs Month (Cols)
  const matrixData: Record<string, Record<string, number>> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const matrixCars = (selectedDept === 'All' || isSectionUser)
    ? filteredCars 
    : filteredCars.filter(c => c.department === selectedDept);

  matrixCars.forEach(c => {
    const date = new Date(c.dateIssued);
    const monthIndex = date.getMonth();
    const monthKey = months[monthIndex];
    
    const key = c.description.reference || "Unspecified";
    const codeMatch = key.match(/Clause\s+([\d\.]+)/);
    const shortKey = codeMatch ? `Clause ${codeMatch[1]}` : (key.length > 20 ? key.substring(0, 20) + '...' : key);

    if (!matrixData[shortKey]) {
      matrixData[shortKey] = {};
      months.forEach(m => matrixData[shortKey][m] = 0);
    }
    matrixData[shortKey][monthKey]++;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
           <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
             <PieChart className="text-green-600"/> Data Analysis & Analytics {isSectionUser && `(${userDepartment})`}
           </h2>
           <p className="text-sm text-gray-500">Statistical overview of Corrective Action Requests.</p>
        </div>
        
        {/* Global Date Filter */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
           <Filter size={16} className="text-gray-400"/>
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-gray-500 uppercase">From</span>
             <input 
               type="date" 
               className="text-sm border rounded p-1 bg-white text-gray-900" 
               value={startDate} 
               onChange={e => setStartDate(e.target.value)}
             />
           </div>
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-gray-500 uppercase">To</span>
             <input 
               type="date" 
               className="text-sm border rounded p-1 bg-white text-gray-900" 
               value={endDate} 
               onChange={e => setEndDate(e.target.value)}
             />
           </div>
        </div>
      </div>

      {/* NEW: KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Avg Response Time */}
        <div className="bg-white p-5 rounded-xl shadow border border-blue-100 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avg Response Time</p>
               <p className="text-2xl font-bold text-blue-700 mt-1">{avgResponseTime} <span className="text-sm font-normal text-gray-400">days</span></p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-500"><Clock size={20}/></div>
        </div>

        {/* Effectiveness Rate */}
        <div className="bg-white p-5 rounded-xl shadow border border-teal-100 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Effectiveness Rate</p>
               <p className="text-2xl font-bold text-teal-700 mt-1">{effectivenessRate}%</p>
            </div>
            <div className="bg-teal-50 p-3 rounded-full text-teal-500"><CheckCircle size={20}/></div>
        </div>

        {/* Closed CARs */}
        <div className="bg-white p-5 rounded-xl shadow border border-green-100 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Closed CARs</p>
               <p className="text-2xl font-bold text-green-700 mt-1">{closedCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-500"><Archive size={20}/></div>
        </div>

        {/* Late Submissions */}
        <div className="bg-white p-5 rounded-xl shadow border border-red-100 flex items-center justify-between">
            <div>
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Late Submissions</p>
               <p className="text-2xl font-bold text-red-700 mt-1">{lateCount}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full text-red-500"><AlertOctagon size={20}/></div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Most Common ISO Clauses */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
           <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
             <BarChart2 size={20} className="text-blue-600"/> Most Common ISO Non-Conformities
           </h3>
           <div className="space-y-4">
             {sortedIso.map(([label, count], idx) => {
               const percentage = (count / filteredCars.length) * 100;
               return (
                 <div key={idx}>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-semibold text-gray-700 truncate w-3/4" title={label}>{label}</span>
                     <span className="font-bold text-blue-600">{count}</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2.5">
                     <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                   </div>
                 </div>
               );
             })}
             {sortedIso.length === 0 && <p className="text-gray-400 italic text-center py-10">No data found for this period.</p>}
           </div>
        </div>

        {/* Chart 2: Source Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center">
           <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 w-full">
             <PieChart size={20} className="text-teal-600"/> CAR Source Comparison
           </h3>
           
           <div className="flex-1 flex flex-col justify-center items-center w-full">
              {filteredCars.length > 0 ? (
                <div className="flex items-center gap-8 w-full justify-around">
                   {/* Simple SVG Pie Chart */}
                   <svg width="200" height="200" viewBox="-100 -100 200 200" className="transform -rotate-90">
                      {(() => {
                         let cumPercent = 0;
                         return sortedSource.map(([label, count], i) => {
                            const percent = count / filteredCars.length;
                            const startAngle = cumPercent * Math.PI * 2;
                            cumPercent += percent;
                            const endAngle = cumPercent * Math.PI * 2;
                            
                            const x1 = Math.cos(startAngle) * 80;
                            const y1 = Math.sin(startAngle) * 80;
                            const x2 = Math.cos(endAngle) * 80;
                            const y2 = Math.sin(endAngle) * 80;
                            
                            // Flag for large arc
                            const largeArcFlag = percent > 0.5 ? 1 : 0;
                            
                            // Colors
                            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                            const color = colors[i % colors.length];
                            
                            // Donut hole
                            const pathData = filteredCars.length === count 
                               ? `M 80 0 A 80 80 0 1 1 -80 0 A 80 80 0 1 1 80 0` // Full circle
                               : `M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                            return <path key={label} d={pathData} fill={color} stroke="white" strokeWidth="2" />;
                         });
                      })()}
                      <circle cx="0" cy="0" r="40" fill="white" />
                   </svg>
                   
                   {/* Legend */}
                   <div className="space-y-2">
                      {sortedSource.map(([label, count], i) => {
                         const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-red-500', 'bg-violet-500'];
                         const colorClass = colors[i % colors.length];
                         return (
                            <div key={label} className="flex items-center gap-2 text-sm">
                               <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                               <span className="text-gray-600 font-medium">{label}</span>
                               <span className="font-bold text-gray-800 ml-auto">({count})</span>
                            </div>
                         );
                      })}
                   </div>
                </div>
              ) : (
                <p className="text-gray-400 italic">No data to display.</p>
              )}
           </div>
        </div>

      </div>

      {/* Chart 3: CAR Volume by Section (Only for Main QA) */}
      {!isSectionUser && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
           <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
             <BarChart2 size={20} className="text-purple-600"/> CAR Volume by Section
           </h3>
           <div className="flex-1 flex items-end gap-2 overflow-x-auto pb-2 custom-scrollbar min-h-[300px]">
             {sortedDept.map(([dept, count], idx) => {
               const max = sortedDept[0]?.[1] || 1;
               const heightPercent = (count / max) * 100;
               const shortName = dept.split(' ').map(w => w[0]).join('').substring(0,4);
               
               return (
                 <div key={idx} className="flex flex-col items-center group w-12 shrink-0">
                    <div className="text-xs font-bold text-purple-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                    <div 
                      className="w-full bg-purple-500 rounded-t-md hover:bg-purple-600 transition-all relative group-hover:shadow-lg"
                      style={{ height: `${Math.max(heightPercent, 1)}%` }}
                    ></div>
                    <div className="text-[10px] text-gray-500 mt-2 transform -rotate-45 truncate w-full text-center" title={dept}>
                      {shortName}
                    </div>
                 </div>
               );
             })}
             {sortedDept.length === 0 && <p className="w-full text-gray-400 italic text-center m-auto">No data found.</p>}
           </div>
        </div>
      )}

      <div className={`grid grid-cols-1 ${isSectionUser ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}>
        
        {/* Top Sections (Low CARs) - QA Only */}
        {!isSectionUser && (
          <div className="lg:col-span-1 bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-lg border border-green-100">
             <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
               <Award size={24} className="text-yellow-500"/> Top Performing Sections
             </h3>
             <p className="text-xs text-green-600 mb-4">Sections with the fewest issued CARs in this period.</p>
             
             <div className="space-y-3">
               {topSections.map((item, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                    <div className="flex items-center gap-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-400' : 'bg-green-600'}`}>
                         {idx + 1}
                       </div>
                       <span className="text-sm font-bold text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{item.count} CARs</span>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Matrix: ISO vs Month */}
        <div className={`${isSectionUser ? 'lg:col-span-1' : 'lg:col-span-2'} bg-white p-6 rounded-xl shadow-lg border border-gray-100`}>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={20} className="text-orange-600"/> Monthly Trend Analysis
              </h3>
              {!isSectionUser && (
                <select 
                  value={selectedDept} 
                  onChange={e => setSelectedDept(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg p-2 bg-white text-gray-900"
                >
                   <option value="All">All Sections</option>
                   {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                 <thead className="bg-gray-100 text-gray-700">
                    <tr>
                       <th className="p-2 border border-gray-200 sticky left-0 bg-gray-100 z-10">ISO Clause</th>
                       {months.map(m => <th key={m} className="p-2 border border-gray-200 text-center w-12">{m}</th>)}
                       <th className="p-2 border border-gray-200 text-center font-bold">Total</th>
                    </tr>
                 </thead>
                 <tbody>
                    {Object.entries(matrixData).map(([clause, monthData], idx) => {
                       const total = Object.values(monthData).reduce((a, b) => a + b, 0);
                       return (
                         <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2 border border-gray-200 font-medium text-gray-800 sticky left-0 bg-white truncate max-w-[150px]" title={clause}>
                               {clause}
                            </td>
                            {months.map(m => {
                               const val = monthData[m];
                               // Heatmap coloring
                               let bgClass = "";
                               if (val > 0) bgClass = "bg-orange-100 text-orange-800";
                               if (val > 2) bgClass = "bg-orange-200 text-orange-900 font-bold";
                               if (val > 5) bgClass = "bg-red-200 text-red-900 font-bold";
                               
                               return (
                                  <td key={m} className={`p-2 border border-gray-200 text-center ${bgClass}`}>
                                     {val > 0 ? val : '-'}
                                  </td>
                               );
                            })}
                            <td className="p-2 border border-gray-200 text-center font-bold bg-gray-50">{total}</td>
                         </tr>
                       );
                    })}
                    {Object.keys(matrixData).length === 0 && (
                       <tr><td colSpan={14} className="p-4 text-center text-gray-400">No trends available for this selection.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

    </div>
  );
};