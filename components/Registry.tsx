import React, { useState, useEffect } from 'react';
import { fetchRegistry } from '../services/store';
import { RegistryEntry, Role } from '../types';
import { Download, AlertTriangle, Eye, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface RegistryProps {
  userRole?: Role;
  currentDepartment?: string;
  isMonitorMode?: boolean;
}

export const Registry: React.FC<RegistryProps> = ({ userRole, currentDepartment, isMonitorMode }) => {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { department: paramDept } = useParams<{ department: string }>();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let data = await fetchRegistry();
      
      // Filter for Section User
      if (userRole === Role.SECTION && currentDepartment) {
        data = data.filter(e => e.section === currentDepartment);
      }
      
      // Filter for Monitor Mode (QA viewing specific section)
      if (isMonitorMode && paramDept) {
        const decodedDept = decodeURIComponent(paramDept);
        data = data.filter(e => e.section === decodedDept);
      }

      setEntries(data);
      setLoading(false);
    };
    loadData();
  }, [userRole, currentDepartment, isMonitorMode, paramDept]);

  const exportToCSV = () => {
    // Removed Reminder Sent from headers and rows
    const headers = ['Section', 'Required Document', 'Original Due Date', 'Status', 'Date Submitted'];
    const rows = entries.map(e => [
      e.section,
      e.requiredDocument,
      e.originalDueDate,
      e.status,
      e.dateSubmitted || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Registry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-green-700" size={48} /></div>;
  }

  return (
    <div>
      {isMonitorMode && (
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-3 font-bold mb-6 shadow-md border-l-4 border-blue-800">
           <div className="bg-white/20 p-2 rounded-full">
             <Eye size={24} />
           </div>
           <div>
              <div className="text-lg">Read-Only Registry</div>
              <div className="text-sm font-normal text-blue-100">Tracking non-submissions for {decodeURIComponent(paramDept || '')}.</div>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-red-800 mb-2 border-l-8 border-red-600 pl-4">Nonsubmission Registry</h2>
          <p className="text-gray-500 pl-6">Tracking of late or non-submitted corrective actions.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <Download size={18} /> Export List
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-red-50 text-red-900 uppercase text-xs font-bold">
            <tr>
              <th className="p-3 border">Section/Dept</th>
              <th className="p-3 border">Required Doc</th>
              <th className="p-3 border">Due Date</th>
              {/* Removed Reminder Sent Column Header */}
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Date Submitted</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={entry.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50'}>
                <td className="p-3 border font-medium">{entry.section}</td>
                <td className="p-3 border">{entry.requiredDocument}</td>
                <td className="p-3 border">{entry.originalDueDate}</td>
                {/* Removed Reminder Sent Column Cell */}
                <td className="p-3 border">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${entry.status === 'Open' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'}`}>
                    {entry.status}
                  </span>
                </td>
                <td className="p-3 border">{entry.dateSubmitted || '-'}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 flex flex-col items-center justify-center">
                   <AlertTriangle className="text-gray-300 mb-2" size={32}/>
                   <span>No late submissions recorded.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};