import React, { useEffect, useState, useMemo } from 'react';
import { AuditTrailEntry, AuditAction, Role } from '../types';
import { fetchGlobalAuditTrail, fetchCARs } from '../services/store';
import { Loader2, PlusCircle, MessageSquare, XCircle, CheckCircle, ShieldCheck, AlertCircle, Archive, Trash2, HelpCircle, Activity, PlayCircle, RotateCcw, Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const auditDisplayMap = {
  [AuditAction.CAR_CREATED]: { text: 'CAR Issued', icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  [AuditAction.RESPONSE_SUBMITTED]: { text: 'Response Submitted', icon: MessageSquare, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  [AuditAction.PLAN_RETURNED]: { text: 'Plan Returned for Revision', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  [AuditAction.PLAN_ACCEPTED]: { text: 'Plan Accepted', icon: CheckCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  [AuditAction.IMPLEMENTATION_COMPLETED]: { text: 'Implementation Done', icon: PlayCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
  [AuditAction.IMPLEMENTATION_REVOKED]: { text: 'Implementation Undone', icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50' },
  [AuditAction.VERIFIED_EFFECTIVE]: { text: 'Verified as Effective', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50' },
  [AuditAction.VERIFIED_INEFFECTIVE]: { text: 'Verified as Ineffective', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  [AuditAction.VALIDATED_AND_CLOSED]: { text: 'Validated and Closed', icon: Archive, color: 'text-green-500', bg: 'bg-green-50' },
  [AuditAction.CAR_DELETED]: { text: 'CAR Deleted', icon: Trash2, color: 'text-gray-500', bg: 'bg-gray-50' },
};

interface RecentActivityProps {
    userRole?: Role;
    userDepartment?: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ userRole, userDepartment }) => {
  const [logs, setLogs] = useState<(AuditTrailEntry & { carRefNo?: string, department?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const activityData = await fetchGlobalAuditTrail();
      const cars = await fetchCARs();
      const carDeptMap: Record<string, string> = {};
      cars.forEach(c => carDeptMap[c.id] = c.department);

      let processedLogs = activityData.map(log => ({
          ...log,
          department: carDeptMap[log.carId] || 'Unknown'
      }));

      if (userRole === Role.SECTION && userDepartment) {
          processedLogs = processedLogs.filter(log => log.department === userDepartment);
      }

      setLogs(processedLogs);
      setLoading(false);
    };
    loadLogs();
  }, [userRole, userDepartment]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1 text-green-600" /> : <ArrowDown size={14} className="ml-1 text-green-600" />;
  };

  const displayedLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        log.userName.toLowerCase().includes(term) ||
        log.carRefNo?.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.department?.toLowerCase().includes(term)
      );
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = (a as any)[sortConfig.key];
        let bValue: any = (b as any)[sortConfig.key];
        
        if (sortConfig.key === 'action') {
            aValue = auditDisplayMap[a.action as AuditAction]?.text || a.action;
            bValue = auditDisplayMap[b.action as AuditAction]?.text || b.action;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [logs, searchTerm, sortConfig]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-green-700" size={48} /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-full text-green-700">
                <Activity size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-800">Recent Activity {userRole === Role.SECTION && `(${userDepartment})`}</h2>
               <p className="text-sm text-gray-500">History of all actions performed in the system.</p>
             </div>
          </div>
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
               type="text" 
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white text-gray-900"
               placeholder="Search activity..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[700px]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
               <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center">Timestamp <SortIndicator columnKey="createdAt" /></div>
                    </th>
                    <th className="p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('action')}>
                      <div className="flex items-center">Action <SortIndicator columnKey="action" /></div>
                    </th>
                    <th className="p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('userName')}>
                      <div className="flex items-center">User <SortIndicator columnKey="userName" /></div>
                    </th>
                    <th className="p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('carRefNo')}>
                      <div className="flex items-center">CAR Ref <SortIndicator columnKey="carRefNo" /></div>
                    </th>
                    <th className="p-4 border-b text-right">Link</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {displayedLogs.map((log) => {
                     const display = auditDisplayMap[log.action] || { text: log.action, icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-50' };
                     const Icon = display.icon;
                     return (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="p-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                 <span className="font-bold text-gray-800">{new Date(log.createdAt).toLocaleDateString()}</span>
                                 <span className="text-xs text-gray-400 font-mono">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${display.bg} ${display.color}`}>
                                    <Icon size={14} />
                                 </div>
                                 <div>
                                    <span className="font-bold text-gray-700">{display.text}</span>
                                    {log.details?.remarks && <p className="text-[10px] text-gray-400 italic truncate max-w-[200px]">"{log.details.remarks}"</p>}
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex flex-col">
                                 <span className="font-semibold text-gray-900">{log.userName}</span>
                                 <span className="text-[10px] uppercase text-gray-400 font-bold">{log.userRole}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex flex-col">
                                 <span className="font-mono font-bold text-blue-700">{log.carRefNo || 'Unknown'}</span>
                                 <span className="text-[10px] text-gray-400">{log.department}</span>
                              </div>
                           </td>
                           <td className="p-4 text-right">
                              <Link 
                                to={`/car/${log.carId}?readonly=true`} 
                                className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="View Record"
                              >
                                 <ExternalLink size={16} />
                              </Link>
                           </td>
                        </tr>
                     );
                  })}
                  {displayedLogs.length === 0 && (
                     <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-500 italic">No activity matching your search.</td>
                     </tr>
                  )}
               </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};