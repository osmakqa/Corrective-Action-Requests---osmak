import React, { useEffect, useState } from 'react';
import { AuditTrailEntry, AuditAction, Role } from '../types';
import { fetchGlobalAuditTrail, fetchCARs } from '../services/store';
import { Loader2, PlusCircle, MessageSquare, XCircle, CheckCircle, ShieldCheck, AlertCircle, Archive, Trash2, HelpCircle, Activity, PlayCircle, RotateCcw } from 'lucide-react';
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

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const activityData = await fetchGlobalAuditTrail();
      
      // We need to fetch CARs to link the department for filtering
      const cars = await fetchCARs();
      const carDeptMap: Record<string, string> = {};
      cars.forEach(c => carDeptMap[c.id] = c.department);

      let processedLogs = activityData.map(log => ({
          ...log,
          department: carDeptMap[log.carId] || 'Unknown'
      }));

      // Filter for Section Users
      if (userRole === Role.SECTION && userDepartment) {
          processedLogs = processedLogs.filter(log => log.department === userDepartment);
      }

      setLogs(processedLogs);
      setLoading(false);
    };
    loadLogs();
  }, [userRole, userDepartment]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-green-700" size={48} /></div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
          <div className="bg-green-100 p-2 rounded-full text-green-700">
             <Activity size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Recent System Activity {userRole === Role.SECTION && `(${userDepartment})`}</h2>
            <p className="text-sm text-gray-500">Live feed of all actions performed across the system.</p>
          </div>
       </div>

       <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[600px]">
          {logs.length === 0 ? (
             <div className="p-12 text-center text-gray-500">No activity recorded for this view.</div>
          ) : (
             <div className="divide-y divide-gray-100 overflow-y-auto custom-scrollbar flex-1">
                {logs.map((log) => {
                   const display = auditDisplayMap[log.action] || { text: log.action, icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-50' };
                   const Icon = display.icon;
                   const dateObj = new Date(log.createdAt);
                   const formattedDate = dateObj.toLocaleDateString();
                   const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                   return (
                      <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex gap-4 items-start">
                         <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${display.bg} ${display.color}`}>
                            <Icon size={20} />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <h3 className="text-sm font-bold text-gray-800">{display.text}</h3>
                               <span className="text-xs text-gray-400 font-mono">{formattedDate} {formattedTime}</span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1">
                               <span className="font-semibold text-gray-900">{log.userName}</span> ({log.userRole}) performed this action on CAR <Link to={`/car/${log.carId}?readonly=true`} className="text-blue-600 hover:underline font-bold font-mono">{log.carRefNo || 'Unknown Ref'}</Link>
                            </p>

                            {log.details?.remarks && (
                               <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 italic">
                                  "{log.details.remarks}"
                               </div>
                            )}
                         </div>
                      </div>
                   );
                })}
             </div>
          )}
       </div>
    </div>
  );
};