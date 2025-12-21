import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { CAR, Role, CARStatus, AuditTrailEntry, AuditAction, DEPARTMENTS } from '../types';
import { fetchCARs, deleteCAR, fetchAuditTrailForCAR, fetchCARById } from '../services/store';
import { generateCARPdf } from '../services/pdfGenerator';
import { ChevronRight, Download, Activity, CheckCircle, AlertOctagon, Clock, Eye, UserCheck, Trash2, Pencil, X, Loader2, History, PlusCircle, MessageSquare, XCircle, ShieldCheck, AlertCircle, Archive, HelpCircle, Filter, RotateCcw, PlayCircle, Search, ListFilter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DashboardProps {
  userRole: Role;
  currentDepartment?: string;
  viewMode: 'active' | 'closed' | 'monitor' | 'all' | 'pending-plans';
  userName?: string;
}

const auditDisplayMap = {
  [AuditAction.CAR_CREATED]: { text: 'CAR Issued', icon: PlusCircle, color: 'text-blue-500' },
  [AuditAction.RESPONSE_SUBMITTED]: { text: 'Response Submitted', icon: MessageSquare, color: 'text-yellow-600' },
  [AuditAction.PLAN_RETURNED]: { text: 'Plan Returned for Revision', icon: XCircle, color: 'text-red-500' },
  [AuditAction.PLAN_ACCEPTED]: { text: 'Plan Accepted', icon: CheckCircle, color: 'text-indigo-500' },
  [AuditAction.IMPLEMENTATION_COMPLETED]: { text: 'Implemented & Ready for Verification', icon: PlayCircle, color: 'text-purple-500' },
  [AuditAction.IMPLEMENTATION_REVOKED]: { text: 'Implementation Undone', icon: RotateCcw, color: 'text-orange-500' },
  [AuditAction.VERIFIED_EFFECTIVE]: { text: 'Verified as Effective', icon: ShieldCheck, color: 'text-teal-500' },
  [AuditAction.VERIFIED_INEFFECTIVE]: { text: 'Verified as Ineffective', icon: AlertCircle, color: 'text-orange-500' },
  [AuditAction.VALIDATED_AND_CLOSED]: { text: 'Validated and Closed', icon: Archive, color: 'text-green-500' },
  [AuditAction.CAR_DELETED]: { text: 'CAR Deleted', icon: Trash2, color: 'text-gray-500' },
};

export const Dashboard: React.FC<DashboardProps> = ({ userRole, currentDepartment, viewMode, userName }) => {
  const [cars, setCars] = useState<CAR[]>([]);
  const [loading, setLoading] = useState(true);
  const { department: paramDept } = useParams<{ department: string }>();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Active');
  const [selectedFilterDept, setSelectedFilterDept] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('All');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [filterSource, setFilterSource] = useState<string>('All');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const targetDepartment = viewMode === 'monitor' ? decodeURIComponent(paramDept || '') : currentDepartment;
  const isMonitorMode = viewMode === 'monitor';
  const isSpecificQA = userRole === Role.QA && userName && userName !== "Main QA Account";
  const isMainQA = userRole === Role.QA && userName === "Main QA Account";
  const isQAClosedView = userRole === Role.QA && viewMode === 'closed';
  const isSectionAllView = userRole === Role.SECTION && viewMode === 'all';

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'edit' | 'delete' | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedCarAuditTrail, setSelectedCarAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [selectedCarRefNo, setSelectedCarRefNo] = useState<string>('');
  const [pdfLoadingCarId, setPdfLoadingCarId] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'active' || viewMode === 'pending-plans') {
        setSelectedStatus('Active');
    } else {
        setSelectedStatus('CLOSED');
    }
  }, [viewMode]);

  const loadData = async () => {
    setLoading(true);
    let allCars = await fetchCARs();
    
    if (userRole === Role.SECTION && currentDepartment === 'IMT') {
       allCars = allCars.filter(c => c.source === 'Incident Management System');
    }
    if (targetDepartment && currentDepartment !== 'IMT') {
      allCars = allCars.filter(c => c.department === targetDepartment);
    }
    if (isQAClosedView && selectedFilterDept) {
        allCars = allCars.filter(c => c.department === selectedFilterDept);
    }
    if (!targetDepartment && isSpecificQA && viewMode === 'active') {
       allCars = allCars.filter(c => {
         const auditors = c.issuedBy ? c.issuedBy.split(' & ') : [];
         return auditors.includes(userName || '');
       });
    }
    if (viewMode === 'pending-plans') {
      allCars = allCars.filter(c => 
        c.status === CARStatus.OPEN || 
        c.status === CARStatus.RETURNED
      );
    } 
    if (userRole === Role.QA && filterSource !== 'All') {
        allCars = allCars.filter(c => c.source === filterSource);
    }
    if (userRole === Role.SECTION && viewMode === 'all') {
      const years = Array.from(new Set(allCars.map(c => new Date(c.dateIssued).getFullYear().toString()))).sort().reverse();
      setAvailableYears(years);
    }

    setCars(allCars);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userRole, targetDepartment, viewMode, userName, isSpecificQA, selectedFilterDept, filterSource]);

  const getDaysRemaining = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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

  const displayedCars = useMemo(() => {
    let filtered = cars.filter(car => {
        if (selectedStatus === 'Active') {
            if (car.status === CARStatus.CLOSED) return false;
        } else if (selectedStatus === 'CLOSED') {
            if (car.status !== CARStatus.CLOSED) return false;
        } else if (selectedStatus !== 'All') {
            if (car.status !== selectedStatus) return false;
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesRef = car.refNo?.toLowerCase().includes(term);
            const matchesCarNo = car.carNo?.toLowerCase().includes(term);
            const matchesDept = car.department?.toLowerCase().includes(term);
            const matchesProblem = car.description?.statement?.toLowerCase().includes(term);
            if (!matchesRef && !matchesCarNo && !matchesDept && !matchesProblem) return false;
        }
        if (isSectionAllView) {
            if (filterYear !== 'All' && !car.dateIssued.startsWith(filterYear)) return false;
        }
        return true;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'days':
            aValue = getDaysRemaining(a.dueDate);
            bValue = getDaysRemaining(b.dueDate);
            break;
          case 'refNo': aValue = a.refNo; bValue = b.refNo; break;
          case 'department': aValue = a.department; bValue = b.department; break;
          case 'issuedBy': aValue = a.issuedBy; bValue = b.issuedBy; break;
          case 'status': aValue = a.status; bValue = b.status; break;
          case 'dueDate': aValue = new Date(a.dueDate).getTime(); bValue = new Date(b.dueDate).getTime(); break;
          default: aValue = (a as any)[sortConfig.key]; bValue = (b as any)[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [cars, selectedStatus, searchTerm, isSectionAllView, filterYear, sortConfig]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'OPEN': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESPONDED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'FOR_VERIFICATION': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'RETURNED': return 'bg-red-100 text-red-800 border-red-200';
      case 'VERIFIED': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'INEFFECTIVE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CLOSED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
      if (status === 'ACCEPTED') return 'FOR IMPLEMENTATION';
      if (status === 'FOR_VERIFICATION') return 'FOR VERIFICATION';
      return status;
  };

  const exportToCSV = () => {
    const headers = ['Ref No', 'Department', 'Status', 'Issued By', 'Due Date', 'Days Remaining'];
    const rows = displayedCars.map(c => [
      c.refNo,
      c.department,
      getStatusLabel(c.status),
      c.issuedBy,
      c.dueDate,
      getDaysRemaining(c.dueDate)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CAR_List_${viewMode}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const initiateAction = (id: string, action: 'edit' | 'delete') => {
    setSelectedCarId(id);
    setPasswordAction(action);
    setConfirmPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async () => {
    let isValid = false;
    if (userName === "Main QA Account") {
       if (confirmPassword === 'admin123') isValid = true;
    } else {
       const parts = (userName || '').trim().split(' ');
       const lastName = parts[parts.length - 1].toLowerCase();
       if (confirmPassword === `${lastName}123`) isValid = true;
    }
    if (isValid) {
       setIsPasswordModalOpen(false);
       if (passwordAction === 'delete' && selectedCarId) {
          await deleteCAR(selectedCarId, userName || 'QA User', userRole);
          loadData();
          setSelectedCarId(null);
       } else if (passwordAction === 'edit' && selectedCarId) {
          navigate(`/car/${selectedCarId}?mode=edit`);
       }
    } else {
       setPasswordError('Incorrect password.');
    }
  };
  
  const handleViewAuditTrail = async (carId: string, refNo: string) => {
    setAuditLoading(true);
    setIsAuditModalOpen(true);
    setSelectedCarRefNo(refNo);
    const trail = await fetchAuditTrailForCAR(carId);
    setSelectedCarAuditTrail(trail);
    setAuditLoading(false);
  };

  const handleDownloadPdf = async (carId: string) => {
    setPdfLoadingCarId(carId);
    try {
      const fullCarData = await fetchCARById(carId);
      if (fullCarData) {
        generateCARPdf(fullCarData);
      } else {
        alert('Error fetching CAR details for PDF generation.');
      }
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("An error occurred while generating the PDF. Please check the console for details.");
    } finally {
      setPdfLoadingCarId(null);
    }
  };

  const totalCount = displayedCars.length;
  const overdueCount = displayedCars.filter(c => getDaysRemaining(c.dueDate) < 0).length;
  const isDQMRActiveView = userRole === Role.DQMR && viewMode === 'active';
  const actionCardCount = isDQMRActiveView
    ? cars.length
    : cars.filter(c => c.status === CARStatus.OPEN || c.status === CARStatus.RETURNED || c.status === CARStatus.RESPONDED || c.status === CARStatus.FOR_VERIFICATION).length;
  const actionCardLabel = isDQMRActiveView ? "For Validation" : "Action Required";
  const actionCardIcon = isDQMRActiveView ? <UserCheck size={24} /> : <AlertOctagon size={24} />;
  const actionCardColor = isDQMRActiveView ? "bg-purple-100 text-purple-600" : "bg-yellow-100 text-yellow-600";

  let pageTitle = 'Dashboard';
  if (viewMode === 'closed') pageTitle = 'Closed Corrective Actions';
  else if (viewMode === 'monitor') pageTitle = `Monitoring: ${targetDepartment}`;
  else if (userRole === Role.DQMR && viewMode === 'active') pageTitle = 'CARs for Validation';
  else if (isSpecificQA) pageTitle = `My Issued CARs - ${userName}`;
  else if (userRole === Role.QA) pageTitle = 'All Active CARs (Main IQA View)';
  else if (viewMode === 'all' && userRole === Role.SECTION) pageTitle = `All CARs: ${currentDepartment}`;
  else if (viewMode === 'pending-plans' && userRole === Role.SECTION) pageTitle = `Pending Action Plans: ${currentDepartment}`;

  const themeColor = viewMode === 'closed' || viewMode === 'all' ? 'gray' : 'green';

  return (
    <div>
      {isMonitorMode && (
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center gap-3 font-bold mb-6 shadow-md border-l-4 border-blue-800">
           <div className="bg-white/20 p-2 rounded-full">
             <Eye size={24} />
           </div>
           <div>
              <div className="text-lg">Read-Only View</div>
              <div className="text-sm font-normal text-blue-100">You are viewing the account of {targetDepartment}. Actions are disabled.</div>
           </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-bold text-gray-800">Audit Trail for CAR: <span className="text-green-700">{selectedCarRefNo}</span></h3>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 -mr-4 custom-scrollbar">
              {auditLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-green-700" size={32} />
                </div>
              ) : (
                <div className="relative pl-6 py-4">
                  <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {selectedCarAuditTrail.map((entry) => {
                    const display = auditDisplayMap[entry.action] || { text: entry.action, icon: HelpCircle, color: 'text-gray-400' };
                    const Icon = display.icon;
                    return (
                      <div key={entry.id} className="relative mb-8">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center bg-white border-4 border-gray-200 z-10">
                           <Icon className={display.color} size={16} />
                        </div>
                        <div className="ml-12">
                          <p className="font-bold text-gray-700">{display.text}</p>
                          <p className="text-xs text-gray-500">
                            by <strong>{entry.userName}</strong> ({entry.userRole}) on {new Date(entry.createdAt).toLocaleString()}
                          </p>
                          {entry.details?.remarks && (
                            <p className="text-sm mt-2 p-3 bg-gray-50 border border-gray-200 rounded italic text-gray-600">
                              <strong>Remarks:</strong> "{entry.details.remarks}"
                            </p>
                          )}
                          {entry.details?.followUpComment && (
                             <p className="text-sm mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-gray-600">
                               <strong>Comment:</strong> {entry.details.followUpComment}
                             </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {selectedCarAuditTrail.length === 0 && <p className="text-gray-500 italic">No history found for this CAR.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-800">Confirm {passwordAction === 'edit' ? 'Edit' : 'Delete'}</h3>
                 <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Please enter your password to confirm this action.</p>
              <input 
                type="password" 
                className="w-full border border-gray-300 bg-white text-gray-900 rounded p-2 mb-2 focus:ring-2 focus:ring-green-500 outline-none" 
                placeholder="Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {passwordError && <p className="text-xs text-red-600 font-bold mb-2">{passwordError}</p>}
              <div className="flex gap-2 justify-end mt-4">
                 <button onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded">Cancel</button>
                 <button 
                   onClick={handlePasswordConfirm} 
                   className={`px-4 py-2 text-white text-sm font-bold rounded ${passwordAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                 >
                   Confirm
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-3xl font-bold text-gray-800 border-l-8 pl-4 border-${themeColor}-700`}>
          {pageTitle}
        </h2>
        {cars.length > 0 && (
          <button 
            onClick={exportToCSV}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
          >
            <Download size={18} /> Export List
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
             <div className="relative w-full lg:w-96">
                <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
                <input 
                   type="text" 
                   className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white text-gray-900"
                   placeholder="Search Ref No, CAR No, Dept, or Issue..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
               <Filter size={16} className="text-gray-600"/>
               <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
               <select 
                   value={selectedStatus} 
                   onChange={(e) => setSelectedStatus(e.target.value)}
                   className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900 focus:ring-1 focus:ring-green-500 outline-none"
               >
                   <option value="Active">Active (Non-Closed)</option>
                   <option value="All">All Records</option>
                   <option value="CLOSED">CLOSED</option>
                   <optgroup label="Specific Status">
                      {Object.values(CARStatus).map(s => (
                          <option key={s} value={s}>{getStatusLabel(s)}</option>
                      ))}
                   </optgroup>
               </select>
            </div>
            {userRole === Role.QA && (
               <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-600"/>
                  <span className="text-xs font-bold text-gray-500 uppercase">Source:</span>
                  <select 
                    value={filterSource} 
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-green-500 outline-none bg-white text-gray-900"
                  >
                     <option value="All">All Sources</option>
                     <option value="Internal Audit">Internal Audit</option>
                     <option value="KPI">KPI</option>
                     <option value="DOH">DOH</option>
                     <option value="IPC">IPC</option>
                     <option value="PhilHealth">PhilHealth</option>
                     <option value="Incident Management System">Incident Management System</option>
                     <option value="Others">Others</option>
                  </select>
               </div>
            )}
            {isQAClosedView && (
               <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-600"/>
                  <span className="text-xs font-bold text-gray-500 uppercase">Department:</span>
                  <select 
                    value={selectedFilterDept} 
                    onChange={(e) => setSelectedFilterDept(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-green-500 outline-none bg-white text-gray-900 min-w-[200px]"
                  >
                     <option value="">-- Select Department --</option>
                     {DEPARTMENTS.map(d => (
                       <option key={d} value={d}>{d}</option>
                     ))}
                  </select>
               </div>
            )}
            {isSectionAllView && (
                 <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-600"/>
                    <span className="text-xs font-bold text-gray-500 uppercase">Year:</span>
                    <select 
                        value={filterYear} 
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900"
                    >
                        <option value="All">All</option>
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                 </div>
            )}
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[600px]">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className={`bg-${themeColor}-50 text-${themeColor}-800 text-sm uppercase tracking-wider sticky top-0 z-10 shadow-sm`}>
              <tr>
                <th className="p-4 border-b border-gray-200 font-bold bg-inherit cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('refNo')}>
                  <div className="flex items-center">Ref No <SortIndicator columnKey="refNo" /></div>
                </th>
                <th className="p-4 border-b border-gray-200 font-bold bg-inherit cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('department')}>
                  <div className="flex items-center">Department <SortIndicator columnKey="department" /></div>
                </th>
                <th className="p-4 border-b border-gray-200 font-bold bg-inherit cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('issuedBy')}>
                  <div className="flex items-center">Issued By <SortIndicator columnKey="issuedBy" /></div>
                </th>
                <th className="p-4 border-b border-gray-200 font-bold bg-inherit cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center">Status <SortIndicator columnKey="status" /></div>
                </th>
                <th className="p-4 border-b border-gray-200 font-bold bg-inherit cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('dueDate')}>
                  <div className="flex items-center">Due Date <SortIndicator columnKey="dueDate" /></div>
                </th>
                <th className="p-4 border-b border-gray-200 font-bold text-center bg-inherit cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort('days')}>
                  <div className="flex items-center justify-center">Days <SortIndicator columnKey="days" /></div>
                </th>
                <th className="p-4 border-b border-gray-200 font-bold text-right bg-inherit">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedCars.map(car => {
                const daysLeft = getDaysRemaining(car.dueDate);
                let daysColor = "text-gray-600";
                if (car.status !== CARStatus.CLOSED && car.status !== CARStatus.VERIFIED && car.status !== CARStatus.INEFFECTIVE) {
                   if (daysLeft < 0) daysColor = "text-red-600 font-bold";
                   else if (daysLeft <= 2) daysColor = "text-yellow-600 font-bold";
                   else daysColor = "text-green-600 font-bold";
                }
                const auditors = car.issuedBy ? car.issuedBy.split(' & ') : [];
                const isAuditor = auditors.includes(userName || '');
                const showEditDelete = userRole === Role.QA && !isMonitorMode && (isMainQA || (isAuditor && car.status === CARStatus.OPEN));

                return (
                  <tr 
                    key={car.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/car/${car.id}${isMonitorMode ? '?readonly=true' : ''}`)}
                  >
                    <td className="p-4 text-sm font-semibold text-gray-900">{car.refNo}</td>
                    <td className="p-4 text-sm text-gray-600">{car.department}</td>
                    <td className="p-4 text-sm text-gray-600 flex items-center gap-1">
                       <UserCheck size={14} className="text-gray-400"/> {car.issuedBy?.split(' & ')[0]?.split(' ')[0]}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(car.status)}`}>
                        {getStatusLabel(car.status)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-mono">
                      {car.dueDate}
                    </td>
                    <td className={`p-4 text-sm text-center ${daysColor}`}>
                      {['CLOSED', 'VERIFIED', 'INEFFECTIVE'].includes(car.status) ? '-' : (daysLeft < 0 ? `${daysLeft}` : daysLeft)}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewAuditTrail(car.id, car.refNo); }}
                        className="text-gray-500 hover:text-gray-800"
                        title="View Audit Trail"
                      >
                        <History size={16} />
                      </button>
                      {(viewMode === 'closed' || (isSectionAllView && car.status === CARStatus.CLOSED)) && (
                         <button
                           onClick={(e) => { e.stopPropagation(); handleDownloadPdf(car.id); }}
                           disabled={pdfLoadingCarId === car.id}
                           className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-wait"
                           title="Download PDF"
                         >
                           {pdfLoadingCarId === car.id ? <Loader2 size={16} className="animate-spin"/> : <Download size={16} />}
                         </button>
                      )}
                      {showEditDelete && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); initiateAction(car.id, 'edit'); }} 
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); initiateAction(car.id, 'delete'); }} 
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayedCars.length === 0 && (
                 <tr>
                   <td colSpan={7} className="p-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                         {isQAClosedView && !selectedFilterDept ? (
                            <>
                              <Filter size={48} className="text-gray-300 mb-2"/>
                              <p>Please select a department to view archived CARs.</p>
                            </>
                         ) : (
                            <>
                              <CheckCircle size={48} className="text-gray-300 mb-2"/>
                              <p>No records found matching your filters.</p>
                            </>
                         )}
                      </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};