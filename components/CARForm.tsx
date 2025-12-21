import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CAR, Role, CARStatus, RemedialAction, CorrectiveAction, DEPARTMENTS, RCAData, ISO_CLAUSES, AuditTrailEntry, AuditAction, RootCause, QA_PERSONNEL } from '../types';
import { fetchCARById, updateCAR, createCAR, updateRegistryOnSubmission, logAuditEvent, fetchAuditTrailForCAR } from '../services/store';
import { generateCARPdf } from '../services/pdfGenerator';
import { generateRemedialSuggestions, generateCorrectiveSuggestions } from '../services/aiService';
import { Save, CheckCircle, XCircle, ArrowLeft, Plus, Trash2, GitBranch, AlertCircle, ShieldCheck, BookOpen, X, Search, ChevronRight, ChevronDown, Eye, RefreshCw, Loader2, MessageSquare, Archive, PlusCircle, HelpCircle, Download, FileText, Activity, Clock, User, PlayCircle, RotateCcw, PenLine, Sparkles, Wand2, Users, Building, BrainCircuit, Bot, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { RCAModule } from './RCAModule';

interface CARFormProps {
  userRole: Role;
  userName?: string;
}

const addDays = (dateStr: string, days: number): string => {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  date.setDate(date.getDate() + days);
  try {
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
};

export const CARForm: React.FC<CARFormProps> = ({ userRole, userName }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = !id;
  
  const isReadOnlyView = searchParams.get('readonly') === 'true';
  const isEditMode = searchParams.get('mode') === 'edit';
  const isSuperUser = userName === "Main QA Account" && isEditMode && !isReadOnlyView;

  const [car, setCar] = useState<CAR | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRCA, setShowRCA] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [showIsoGuide, setShowIsoGuide] = useState(false);
  const [isoSearch, setIsoSearch] = useState('');
  const [expandedIsoClause, setExpandedIsoClause] = useState<string | null>(null);

  const [newRemedial, setNewRemedial] = useState('');
  const [newCorrective, setNewCorrective] = useState<Partial<CorrectiveAction>>({});
  
  const [remedialSuggestions, setRemedialSuggestions] = useState<string[]>([]);
  const [isRemedialAiLoading, setIsRemedialAiLoading] = useState(false);
  const [correctiveSuggestions, setCorrectiveSuggestions] = useState<string[]>([]);
  const [isCorrectiveAiLoading, setIsCorrectiveAiLoading] = useState(false);

  const [qaRemarks, setQaRemarks] = useState('');
  const [remarksError, setRemarksError] = useState(false);
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // Corrective Action Plan Sorting State
  const [caSortConfig, setCaSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (isNew) {
        if (isReadOnlyView) { navigate('/dashboard'); return; }
        if (location.state && location.state.reIssueData) {
          setCar(location.state.reIssueData);
          setLoading(false);
          return;
        }
        const dateIssued = new Date().toISOString().split('T')[0];
        const dueDate = addDays(dateIssued, 5);
        setCar({
          id: '', refNo: '', department: '', isoClause: '', carNo: '', source: 'Internal Audit', dateOfAudit: '',
          description: { statement: '', evidence: '', reference: '' },
          issuedBy: (userRole === Role.QA && userName) ? userName : '', 
          dateIssued: dateIssued, remedialActions: [], correctiveActions: [], rootCauses: [],
          rcaData: { chains: [], paretoItems: [] },
          status: CARStatus.OPEN, isLate: false, dueDate: dueDate
        });
      } else {
        if (id) {
          const found = await fetchCARById(id);
          const trail = await fetchAuditTrailForCAR(id);
          if (found) {
            if (!found.rcaData) found.rcaData = { chains: [], paretoItems: [] };
            setCar(found);
            setAuditTrail(trail);
            if (found.returnRemarks) setQaRemarks(found.returnRemarks);
          } else {
            navigate('/dashboard');
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [id, isNew, navigate, isReadOnlyView, userRole, userName, location.state]);

  const handleDownloadPdf = async () => {
    if (!car || !car.id) return;
    setIsPdfLoading(true);
    try {
      const fullCarData = await fetchCARById(car.id);
      if (fullCarData) generateCARPdf(fullCarData);
      else throw new Error("Could not fetch full CAR details for PDF generation.");
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("An error occurred while generating the PDF. Please check the console for details.");
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleGenerateRemedial = async () => {
    if (!car) return;
    setIsRemedialAiLoading(true);
    try {
      const suggestions = await generateRemedialSuggestions(car.description.statement, car.description.evidence);
      setRemedialSuggestions(suggestions);
    } finally {
      setIsRemedialAiLoading(false);
    }
  };

  const handleGenerateCorrective = async () => {
    if (!car) return;
    const causes = car.rootCauses.map(rc => rc.cause);
    if (causes.length === 0) {
      alert("Please perform Root Cause Analysis (RCA) or save identified root causes before generating corrective actions.");
      return;
    }
    setIsCorrectiveAiLoading(true);
    try {
      const suggestions = await generateCorrectiveSuggestions(causes, car.description.statement);
      setCorrectiveSuggestions(suggestions);
    } finally {
      setIsCorrectiveAiLoading(false);
    }
  };

  const selectRemedialSuggestion = (suggestion: string) => {
    setCar(prev => prev ? ({ ...prev, remedialActions: [...prev.remedialActions, { id: crypto.randomUUID(), action: suggestion }] }) : null);
    setRemedialSuggestions(prev => prev.filter(s => s !== suggestion));
  };

  const selectCorrectiveSuggestion = (suggestion: string) => {
    setNewCorrective(prev => ({ ...prev, action: suggestion }));
    setCorrectiveSuggestions(prev => prev.filter(s => s !== newCorrective.action));
  };

  const handleSortCA = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (caSortConfig && caSortConfig.key === key && caSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setCaSortConfig({ key, direction });
  };

  const CASortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (!caSortConfig || caSortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-30" />;
    return caSortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1 text-blue-600" /> : <ArrowDown size={12} className="ml-1 text-blue-600" />;
  };

  const sortedCorrectiveActions = useMemo(() => {
    if (!car) return [];
    if (!caSortConfig) return car.correctiveActions;
    return [...car.correctiveActions].sort((a, b) => {
      let aValue: any = (a as any)[caSortConfig.key] || '';
      let bValue: any = (b as any)[caSortConfig.key] || '';
      if (caSortConfig.key === 'expectedDate') {
          aValue = new Date(aValue).getTime() || 0;
          bValue = new Date(bValue).getTime() || 0;
      }
      if (aValue < bValue) return caSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return caSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [car?.correctiveActions, caSortConfig]);

  if (loading || !car) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-green-700" size={48} /></div>;

  const validateNewCar = (): boolean => {
    if (!car) return false;
    const newErrors: Record<string, string> = {};
    if (!car.department?.trim()) newErrors.department = 'Department is required.';
    if ((car.source === 'Internal Audit' || car.source === 'KPI') && !car.isoClause?.trim()) newErrors.isoClause = 'ISO Clause is required.';
    if (!car.source?.trim()) newErrors.source = 'Source is required.';
    if (!car.dateOfAudit) newErrors.dateOfAudit = 'Date of Audit is required.';
    if (!car.description.statement?.trim()) newErrors.statement = 'Statement (Problem) is required.';
    if (!car.description.evidence?.trim()) newErrors.evidence = 'Evidence is required.';
    if (!car.description.reference?.trim()) newErrors.reference = 'Reference is required.';
    if (!car.issuedBy?.trim()) newErrors.issuedBy = 'At least one Auditor is required.';
    if (!car.dateIssued) newErrors.dateIssued = 'Date Issued is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (isNew && !validateNewCar()) return;
    setLoading(true);
    if (isNew) {
      const newCar = await createCAR(car);
      if (newCar) await logAuditEvent(newCar.id, userName || 'IQA User', userRole, AuditAction.CAR_CREATED);
    } else {
      await updateCAR(car);
    }
    setLoading(false);
    navigate('/dashboard');
  };

  const handleUpdate = (field: keyof CAR, value: any) => {
    setCar(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      if (field === 'dateIssued' && !isSuperUser) {
        const calculatedDueDate = addDays(value, 5);
        if (calculatedDueDate.length === 10) updated.dueDate = calculatedDueDate;
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => { const newErrors = { ...prev }; delete newErrors[field as string]; return newErrors; });
    }
  };

  const handleAuditorChange = (index: number, name: string) => {
    const current = car.issuedBy ? car.issuedBy.split(' & ') : ['', ''];
    current[index] = name;
    const newValue = current.filter(n => n.trim() !== '').join(' & ');
    handleUpdate('issuedBy', newValue);
  };

  const handleNCUpdate = (field: 'statement' | 'evidence' | 'reference', value: string) => {
    setCar(prev => prev ? ({ ...prev, description: { ...prev.description, [field]: value } }) : null);
     if (errors[field]) { setErrors(prev => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; }); }
  };

  const handleRCASave = (data: RCAData) => {
    let newRootCauses: RootCause[] = [];
    const validParetoItems = data.paretoItems.filter(i => i.frequency > 0);
    if (validParetoItems.length > 0) {
       const sorted = [...validParetoItems].sort((a,b) => b.frequency - a.frequency);
       const totalFreq = sorted.reduce((sum, item) => sum + item.frequency, 0);
       if (totalFreq > 0) {
           let runningFreq = 0;
           for (const item of sorted) {
              runningFreq += item.frequency;
              const cumulative = (runningFreq / totalFreq);
              newRootCauses.push({ id: item.id, cause: item.cause });
              if (cumulative >= 0.8) break;
           }
       }
    }
    if (newRootCauses.length === 0 && data.chains && data.chains.length > 0) {
       newRootCauses = data.chains.map(chain => {
          const validWhys = chain.whys.filter(w => w && w.trim().length > 0);
          if (validWhys.length > 0) return { id: chain.id, cause: validWhys[validWhys.length - 1] };
          return null;
       }).filter((item): item is RootCause => item !== null);
    }
    if (newRootCauses.length === 0 && data.rootCauseHypothesis && data.rootCauseHypothesis.trim()) {
        newRootCauses = [{ id: 'hypothesis', cause: data.rootCauseHypothesis }];
    }
    setCar(prev => prev ? ({ ...prev, rcaData: data, rootCauses: newRootCauses, causeOfNonConformance: data.rootCauseHypothesis }) : null);
    setShowRCA(false);
    setCorrectiveSuggestions([]);
  };

  const addRemedial = () => {
    if (!newRemedial.trim()) return;
    setCar(prev => prev ? ({ ...prev, remedialActions: [...prev.remedialActions, { id: crypto.randomUUID(), action: newRemedial }] }) : null);
    setNewRemedial('');
    setRemedialSuggestions(prev => prev.filter(s => s !== newRemedial));
  };

  const addCorrective = () => {
    if (!newCorrective.action || !newCorrective.personResponsible || !newCorrective.expectedDate) return;
    setCar(prev => prev ? ({ ...prev, correctiveActions: [...prev.correctiveActions, { id: crypto.randomUUID(), ...newCorrective } as CorrectiveAction] }) : null);
    setNewCorrective({ personResponsible: '', expectedDate: '', action: '' });
    setCorrectiveSuggestions(prev => prev.filter(s => s !== newCorrective.action));
  };

  const submitResponse = async () => {
    if (!car) return;
    if (!car.acknowledgedBy || !car.dateAcknowledged) { alert("Acknowledgement details required."); return; }
    setLoading(true);
    const updatedCar = { ...car, status: CARStatus.RESPONDED, dateResponseSubmitted: new Date().toISOString().split('T')[0] };
    await updateCAR(updatedCar);
    await updateRegistryOnSubmission(car.id);
    await logAuditEvent(car.id, car.acknowledgedBy || 'Section User', Role.SECTION, AuditAction.RESPONSE_SUBMITTED);
    setLoading(false);
    navigate('/dashboard');
  };

  const reviewCAR = async (accept: boolean) => {
    if (!car) return;
    if (!accept && !qaRemarks.trim()) { setRemarksError(true); return; }
    setLoading(true);
    const updated = { ...car, status: accept ? CARStatus.ACCEPTED : CARStatus.RETURNED, acceptedBy: accept ? userName : undefined, dateAccepted: accept ? new Date().toISOString().split('T')[0] : undefined, returnRemarks: qaRemarks, dueDate: accept ? car.dueDate : addDays(new Date().toISOString().split('T')[0], 2), isReturned: !accept };
    await updateCAR(updated as any);
    await logAuditEvent(car.id, userName || 'IQA User', userRole, accept ? AuditAction.PLAN_ACCEPTED : AuditAction.PLAN_RETURNED, { remarks: qaRemarks });
    setLoading(false);
    navigate('/dashboard');
  };

  const markImplemented = async () => {
    if (!car) return;
    setLoading(true);
    await updateCAR({ ...car, status: CARStatus.FOR_VERIFICATION });
    await logAuditEvent(car.id, userName || 'Section User', Role.SECTION, AuditAction.IMPLEMENTATION_COMPLETED);
    setLoading(false);
    navigate('/dashboard');
  };

  const undoImplementation = async () => {
    if (!car || car.status !== CARStatus.FOR_VERIFICATION) return;
    setLoading(true);
    const updated = { ...car, status: CARStatus.ACCEPTED };
    await updateCAR(updated as any);
    setLoading(false);
    setCar(updated as any);
  };

  const verifyCAR = async (effective: boolean) => {
    if (!car) return;
    if (!effective) { setShowReissueModal(true); return; }
    setLoading(true);
    const updated = { ...car, status: CARStatus.VERIFIED, isEffective: true, isCleared: true, verifiedBy: userName || 'IQA User', dateVerified: new Date().toISOString().split('T')[0] };
    await updateCAR(updated as any);
    await logAuditEvent(car.id, userName || 'IQA User', userRole, AuditAction.VERIFIED_EFFECTIVE, { followUpComment: car.followUpComment });
    setLoading(false);
    navigate('/dashboard');
  };

  const undoVerification = async () => {
    if (!car) return;
    setLoading(true);
    const updated = { ...car, status: CARStatus.FOR_VERIFICATION, isEffective: undefined, isCleared: undefined, verifiedBy: undefined, dateVerified: undefined };
    await updateCAR(updated as any);
    setLoading(false);
    setCar(updated as any);
  };

  const confirmReissue = async (shouldReissue: boolean) => {
    if (!car) return;
    setLoading(true);
    const updatedOldCar = { ...car, status: CARStatus.INEFFECTIVE, isEffective: false, isCleared: false, verifiedBy: userName || 'IQA User', dateVerified: new Date().toISOString().split('T')[0] };
    await updateCAR(updatedOldCar as any);
    await logAuditEvent(car.id, userName || 'IQA User', userRole, AuditAction.VERIFIED_INEFFECTIVE, { followUpComment: car.followUpComment });
    setShowReissueModal(false);
    if (shouldReissue) {
       const dateIssued = new Date().toISOString().split('T')[0];
       const reIssueData: CAR = { id: '', refNo: `${car.refNo} (Re-issue)`, department: car.department, isoClause: car.isoClause, carNo: `${car.carNo} (Re-issue)`, source: car.source, dateOfAudit: car.dateOfAudit, description: { ...car.description }, issuedBy: userName || car.issuedBy, dateIssued: dateIssued, remedialActions: [], correctiveActions: [], rootCauses: [], rcaData: { chains: [], paretoItems: [] }, status: CARStatus.OPEN, isLate: false, dueDate: addDays(dateIssued, 5) };
       navigate('/car/new', { state: { reIssueData } });
    } else {
       setLoading(false);
       navigate('/dashboard');
    }
  };

  const validateCAR = async () => {
    if (!car) return;
    setLoading(true);
    await updateCAR({ ...car, status: CARStatus.CLOSED, validatedBy: userName || 'DQMR', dateValidated: new Date().toISOString().split('T')[0] });
    await logAuditEvent(car.id, userName || 'DQMR', userRole, AuditAction.VALIDATED_AND_CLOSED);
    setLoading(false);
    navigate('/dashboard');
  };

  const undoValidation = async () => {
    if (!car) return;
    setLoading(true);
    const updated = { ...car, status: CARStatus.VERIFIED, validatedBy: undefined, dateValidated: undefined };
    await updateCAR(updated as any);
    setLoading(false);
    setCar(updated as any);
  };

  const canEditHeader = !isReadOnlyView && (isSuperUser || (isNew && userRole === Role.QA) || (userRole === Role.QA && isEditMode));
  const canRespond = !isReadOnlyView && (isSuperUser || (userRole === Role.SECTION && (car.status === CARStatus.OPEN || car.status === CARStatus.RETURNED || car.status === CARStatus.RESPONDED)));
  const canReview = !isReadOnlyView && (isSuperUser || (userRole === Role.QA && car.status === CARStatus.RESPONDED));
  const canVerify = !isReadOnlyView && (isSuperUser || (userRole === Role.QA && car.status === CARStatus.FOR_VERIFICATION));
  const canUndoVerify = !isReadOnlyView && userRole === Role.QA && (car.status === CARStatus.VERIFIED || car.status === CARStatus.INEFFECTIVE);
  const canImplement = !isReadOnlyView && (isSuperUser || ((userRole === Role.SECTION || userRole === Role.QA) && car.status === CARStatus.ACCEPTED));
  const canUndoImplement = !isReadOnlyView && (userRole === Role.SECTION || userRole === Role.QA) && car.status === CARStatus.FOR_VERIFICATION;
  const canValidate = !isReadOnlyView && (isSuperUser || (userRole === Role.DQMR && (car.status === CARStatus.VERIFIED || car.status === CARStatus.INEFFECTIVE)));
  const canUndoValidate = !isReadOnlyView && userRole === Role.DQMR && car.status === CARStatus.CLOSED;

  const hasRCAData = car.rcaData && (car.rcaData.chains.length > 0 || car.rcaData.paretoItems.length > 0);
  const isIsoApplicable = car.source === 'Internal Audit' || car.source === 'KPI';

  const getInputClass = (field: string, editable: boolean) => {
    const baseClass = "w-full mt-1 p-3 border rounded-lg text-sm transition-all shadow-sm";
    if (editable) {
        const errorClass = errors[field] ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-400 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
        return `${baseClass} ${errorClass} text-gray-900 font-medium placeholder-gray-400`;
    } else {
        return `${baseClass} border-gray-200 bg-white text-gray-900 cursor-not-allowed opacity-90`;
    }
  };
  const getDateInputClass = (field: string, editable: boolean) => `${getInputClass(field, editable)} ${editable ? 'cursor-pointer' : ''}`;
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1";
  const activeLabelClass = "block text-xs font-bold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1";

  const FieldLabel = ({ label, editable, required }: { label: string, editable: boolean, required?: boolean }) => (
      <label className={editable ? activeLabelClass : labelClass}>
          {label} {required && <span className="text-red-500 ml-1">*</span>}
          {(editable && !isSuperUser) && <PenLine size={10} className="text-blue-400 ml-1" />}
          {isSuperUser && <ShieldCheck size={10} className="text-purple-400 ml-1" />}
      </label>
  );

  const ActiveSectionBanner = ({ title, description }: { title: string, description: string }) => (
      <div className="bg-blue-600 text-white px-6 py-3 flex items-center gap-3 animate-pulse">
          <AlertCircle size={20} className="text-yellow-300" />
          <div><p className="font-bold text-sm uppercase tracking-wide">{title}</p><p className="text-xs text-blue-100">{description}</p></div>
      </div>
  );

  return (
    <div className="space-y-6 pb-20 relative max-w-5xl mx-auto">
      
      {/* Super User Power Banner */}
      {isSuperUser && (
        <div className="bg-purple-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center justify-between mb-8 border-b-4 border-purple-800">
          <div className="flex items-center gap-4"><div className="bg-white/20 p-2 rounded-full"><ShieldCheck size={28}/></div><div><h2 className="text-lg font-extrabold uppercase tracking-tighter">Super User Power Edit</h2><p className="text-xs text-purple-100 font-medium">Instant overrides enabled.</p></div></div>
          <button onClick={handleSave} className="bg-white text-purple-700 px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-purple-50 flex items-center gap-2 transition-all active:scale-95"><Save size={18}/> Apply All Corrections</button>
        </div>
      )}

      {/* ISO Guide Modal */}
      {showIsoGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0"><div className="flex items-center gap-2"><BookOpen size={20} className="text-green-800"/><h3 className="font-bold text-green-800">ISO 9001:2015 Guide</h3></div><button onClick={() => setShowIsoGuide(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full"><X size={20}/></button></div>
             <div className="p-4 border-b border-gray-100 bg-white shrink-0"><div className="relative"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" placeholder="Search clauses..." className="w-full border border-gray-300 pl-10 pr-4 py-2.5 rounded-lg text-sm bg-white text-gray-900" value={isoSearch} onChange={e => setIsoSearch(e.target.value)} autoFocus /></div></div>
             <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                {ISO_CLAUSES.filter(c => c.code.includes(isoSearch) || c.title.toLowerCase().includes(isoSearch.toLowerCase())).map(c => (
                   <div key={c.code} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50" onClick={() => setExpandedIsoClause(expandedIsoClause === c.code ? null : c.code)}>
                         <div className="flex items-center gap-3"><span className="font-bold text-green-700 bg-green-100 px-2 py-1 rounded text-xs border border-green-200">{c.code}</span><span className="text-gray-800 font-semibold text-sm">{c.title}</span></div>
                         {expandedIsoClause === c.code ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                      </button>
                      {expandedIsoClause === c.code && (<div className="p-4 bg-gray-50 border-t border-gray-100 animate-in fade-in"><p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-line border-l-4 border-green-300 pl-3">{c.content}</p><button onClick={() => { handleNCUpdate('reference', `ISO 9001:2015 Clause ${c.code} - ${c.title}`); handleUpdate('isoClause', c.code); setShowIsoGuide(false); }} className="bg-green-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium ml-auto"><CheckCircle size={14}/> Use Citation</button></div>)}
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRCA && (
        <RCAModule 
          initialData={car.rcaData} 
          problemStatement={car.description.statement} 
          refNo={car.refNo}
          carNo={car.carNo}
          onSave={handleRCASave} 
          onCancel={() => setShowRCA(false)} 
          isReadOnly={!canRespond} 
        />
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="mr-2" /> Back
        </button>
        <div className="space-x-3">
           {car.status === CARStatus.CLOSED && (
             <button onClick={handleDownloadPdf} disabled={isPdfLoading} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 font-semibold shadow-sm flex items-center gap-2 transition-all">
               {isPdfLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
               {isPdfLoading ? 'Generating...' : 'Download PDF'}
             </button>
           )}
           {(isNew || isEditMode) && !isReadOnlyView && (
             <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-bold shadow-md flex items-center gap-2 transition-all hover:-translate-y-0.5">
               <Save size={18} /> {isNew ? 'Issue CAR' : 'Save Changes'}
             </button>
           )}
        </div>
      </div>

      {/* Issuance Card */}
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canEditHeader ? 'bg-white border-blue-300 ring-2 ring-blue-100 shadow-md' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
         {canEditHeader && <ActiveSectionBanner title="Issuance Details" description="Complete the issuance information." />}
         <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={18}/> Key Info</h3></div>
         <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div><FieldLabel label="Ref No" editable={canEditHeader}/><input disabled={!canEditHeader} value={car.refNo} onChange={(e) => handleUpdate('refNo', e.target.value)} className={getInputClass('refNo', canEditHeader)} /></div>
            <div><FieldLabel label="Department" editable={canEditHeader}/><select disabled={!canEditHeader} value={car.department} onChange={(e) => handleUpdate('department', e.target.value)} className={getInputClass('department', canEditHeader)}><option value="">Select...</option>{DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></div>
            <div><FieldLabel label="ISO Clause" editable={canEditHeader && isIsoApplicable}/><input readOnly={!isSuperUser} disabled={!canEditHeader || !isIsoApplicable} value={car.isoClause} onChange={(e) => handleUpdate('isoClause', e.target.value)} className={getInputClass('isoClause', isSuperUser && isIsoApplicable)} /></div>
            <div><FieldLabel label="CAR No" editable={canEditHeader}/><input disabled={!canEditHeader} value={car.carNo} onChange={(e) => handleUpdate('carNo', e.target.value)} className={getInputClass('carNo', canEditHeader)} /></div>
         </div>
      </div>

      {/* Response Card */}
      {!isNew && (
        <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canRespond ? 'bg-white border-blue-400 ring-2 ring-blue-200 shadow-xl' : 'bg-gray-50 border-gray-200 opacity-80'}`}>
           {canRespond && <ActiveSectionBanner title="Action Required: Response" description="Conduct RCA and submit your response." />}
           <div className={`px-6 py-4 border-b flex items-center justify-between ${canRespond ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}><h3 className={`font-bold flex items-center gap-2 ${canRespond ? 'text-blue-900' : 'text-gray-800'}`}><Activity size={18}/> Auditee Response</h3></div>
           <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div><FieldLabel label="Acknowledged By" editable={canRespond} required/><input disabled={!canRespond} value={car.acknowledgedBy || ''} onChange={(e) => handleUpdate('acknowledgedBy', e.target.value)} className={getInputClass('acknowledgedBy', canRespond)} /></div>
                 <div><FieldLabel label="Date Acknowledged" editable={canRespond} required/><input type="date" disabled={!canRespond} value={car.dateAcknowledged || ''} onChange={(e) => handleUpdate('dateAcknowledged', e.target.value)} className={getDateInputClass('dateAcknowledged', canRespond)} /></div>
              </div>
              
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 mb-8">
                 <div className="flex justify-between items-start mb-4">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase"><GitBranch size={16}/> Root Cause Analysis</label>
                    <button onClick={() => setShowRCA(true)} className={`px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 ${canRespond || hasRCAData ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{canRespond ? (hasRCAData ? 'Edit Analysis' : 'Start Analysis') : 'View Analysis'}</button>
                 </div>
                 {car.rootCauses && car.rootCauses.length > 0 && (<ul className="bg-white p-4 rounded border border-gray-200 space-y-2">{car.rootCauses.map((rc) => (<li key={rc.id} className="flex items-start gap-2 text-sm text-gray-800"><span className="text-purple-600 font-bold">•</span>{rc.cause}</li>))}</ul>)}
              </div>

              <div className="mb-8">
                 <div className="flex justify-between items-center mb-2">
                    <FieldLabel label="Corrective Action Plan" editable={canRespond} />
                    {canRespond && (<button onClick={handleGenerateCorrective} disabled={isCorrectiveAiLoading || car.rootCauses.length === 0} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md">{isCorrectiveAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />} AI Assist</button>)}
                 </div>
                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                         <tr>
                           <th className="p-3 w-1/2 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSortCA('action')}>
                             <div className="flex items-center">Action <CASortIndicator columnKey="action" /></div>
                           </th>
                           <th className="p-3 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSortCA('personResponsible')}>
                             <div className="flex items-center">Responsible <CASortIndicator columnKey="personResponsible" /></div>
                           </th>
                           <th className="p-3 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => handleSortCA('expectedDate')}>
                             <div className="flex items-center">Target Date <CASortIndicator columnKey="expectedDate" /></div>
                           </th>
                           {canRespond && <th className="p-3"></th>}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {sortedCorrectiveActions.map(c => (<tr key={c.id} className="bg-white"><td className="p-3">{c.action}</td><td className="p-3">{c.personResponsible}</td><td className="p-3 font-mono text-xs">{c.expectedDate}</td>{canRespond && (<td className="p-3 text-center"><button onClick={() => setCar(prev => prev ? ({...prev, correctiveActions: prev.correctiveActions.filter(x => x.id !== c.id)}) : null)} className="text-red-400"><Trash2 size={16}/></button></td>)}</tr>))}
                       </tbody>
                    </table>
                    {canRespond && (
                      <div className="bg-gray-50 p-3 border-t border-gray-200 flex gap-3">
                        <input className="flex-1 p-2 text-sm border rounded" placeholder="Enter action..." value={newCorrective.action || ''} onChange={e => setNewCorrective({...newCorrective, action: e.target.value})} />
                        <input className="w-32 p-2 text-sm border rounded" placeholder="Responsible" value={newCorrective.personResponsible || ''} onChange={e => setNewCorrective({...newCorrective, personResponsible: e.target.value})} />
                        <input type="date" className="w-32 p-2 text-sm border rounded" value={newCorrective.expectedDate || ''} onChange={e => setNewCorrective({...newCorrective, expectedDate: e.target.value})} />
                        <button onClick={addCorrective} className="bg-green-600 text-white p-2 rounded"><Plus size={18}/></button>
                      </div>
                    )}
                 </div>
              </div>
              {canRespond && (<div className="mt-8 flex justify-end"><button onClick={submitResponse} className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2"><Save size={18}/> Submit Response</button></div>)}
           </div>
        </div>
      )}

    </div>
  );
};