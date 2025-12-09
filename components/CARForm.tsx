
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CAR, Role, CARStatus, RemedialAction, CorrectiveAction, DEPARTMENTS, RCAData, ISO_CLAUSES, AuditTrailEntry, AuditAction, RootCause } from '../types';
import { fetchCARById, updateCAR, createCAR, updateRegistryOnSubmission, logAuditEvent, fetchAuditTrailForCAR } from '../services/store';
import { generateCARPdf } from '../services/pdfGenerator';
import { generateRemedialSuggestions, generateCorrectiveSuggestions } from '../services/aiService';
import { Save, CheckCircle, XCircle, ArrowLeft, Plus, Trash2, GitBranch, AlertCircle, ShieldCheck, BookOpen, X, Search, ChevronRight, ChevronDown, Eye, RefreshCw, Loader2, MessageSquare, Archive, PlusCircle, HelpCircle, Download, FileText, Activity, Clock, User, PlayCircle, RotateCcw, PenLine, Sparkles, Wand2, Users, Building, BrainCircuit } from 'lucide-react';
import { RCAModule } from './RCAModule';

interface CARFormProps {
  userRole: Role;
  userName?: string;
}

// Helper moved outside to avoid initialization errors
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const CARForm: React.FC<CARFormProps> = ({ userRole, userName }) => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = !id;
  
  // Check modes
  const isReadOnlyView = searchParams.get('readonly') === 'true';
  const isEditMode = searchParams.get('mode') === 'edit';

  const [car, setCar] = useState<CAR | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRCA, setShowRCA] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // ISO Guide State
  const [showIsoGuide, setShowIsoGuide] = useState(false);
  const [isoSearch, setIsoSearch] = useState('');
  const [expandedIsoClause, setExpandedIsoClause] = useState<string | null>(null);

  const [newRemedial, setNewRemedial] = useState('');
  const [newCorrective, setNewCorrective] = useState<Partial<CorrectiveAction>>({});
  const [assignType, setAssignType] = useState<'person' | 'section'>('person');
  
  // AI Suggestions State
  const [remedialSuggestions, setRemedialSuggestions] = useState<string[]>([]);
  const [isRemedialAiLoading, setIsRemedialAiLoading] = useState(false);
  const [correctiveSuggestions, setCorrectiveSuggestions] = useState<string[]>([]);
  const [isCorrectiveAiLoading, setIsCorrectiveAiLoading] = useState(false);

  // QA Review State
  const [qaRemarks, setQaRemarks] = useState('');
  const [remarksError, setRemarksError] = useState(false);

  // Re-issue Modal
  const [showReissueModal, setShowReissueModal] = useState(false);
  
  // PDF Loading State
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (isNew) {
        if (isReadOnlyView) {
          navigate('/dashboard');
          return;
        }

        // Check for re-issue data passed via navigation state
        if (location.state && location.state.reIssueData) {
          setCar(location.state.reIssueData);
          setLoading(false);
          return;
        }

        const dateIssued = new Date().toISOString().split('T')[0];
        const dueDate = addDays(dateIssued, 5);
        
        setCar({
          id: '',
          refNo: '', department: '', isoClause: '', carNo: '', source: 'Internal Audit', dateOfAudit: '',
          description: { statement: '', evidence: '', reference: '' },
          issuedBy: (userRole === Role.QA && userName) ? userName : '', 
          dateIssued: dateIssued, 
          remedialActions: [], correctiveActions: [], rootCauses: [],
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
            // Initialize remarks if existing
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
      if (fullCarData) {
        generateCARPdf(fullCarData);
      } else {
        throw new Error("Could not fetch full CAR details for PDF generation.");
      }
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
    const suggestions = await generateRemedialSuggestions(car.description.statement, car.description.evidence);
    setRemedialSuggestions(suggestions);
    setIsRemedialAiLoading(false);
  };

  const handleGenerateCorrective = async () => {
    if (!car) return;
    
    // Check if we have root causes
    const causes = car.rootCauses.map(rc => rc.cause);
    if (causes.length === 0) {
      alert("Please perform Root Cause Analysis (RCA) or save identified root causes before generating corrective actions.");
      return;
    }

    setIsCorrectiveAiLoading(true);
    const suggestions = await generateCorrectiveSuggestions(causes, car.description.statement);
    setCorrectiveSuggestions(suggestions);
    setIsCorrectiveAiLoading(false);
  };

  if (loading || !car) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-green-700" size={48} /></div>;

  const validateNewCar = (): boolean => {
    if (!car) return false;
    const newErrors: Record<string, string> = {};

    if (!car.refNo?.trim()) newErrors.refNo = 'Reference Number is required.';
    if (!car.department?.trim()) newErrors.department = 'Department is required.';
    
    // ISO Clause validation only if source is Internal Audit or KPI
    if ((car.source === 'Internal Audit' || car.source === 'KPI') && !car.isoClause?.trim()) {
        newErrors.isoClause = 'ISO Clause is required.';
    }

    if (!car.carNo?.trim()) newErrors.carNo = 'CAR Number is required.';
    if (!car.source?.trim()) newErrors.source = 'Source is required.';
    if (!car.dateOfAudit) newErrors.dateOfAudit = 'Date of Audit is required.';
    if (!car.description.statement?.trim()) newErrors.statement = 'Statement (Problem) is required.';
    if (!car.description.evidence?.trim()) newErrors.evidence = 'Evidence is required.';
    if (!car.description.reference?.trim()) newErrors.reference = 'Reference is required.';
    if (!car.issuedBy?.trim()) newErrors.issuedBy = 'Issued By is required.';
    if (!car.dateIssued) newErrors.dateIssued = 'Date Issued is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (isNew) {
      if (!validateNewCar()) {
        return; 
      }
    }
    setLoading(true);
    if (isNew) {
      const newCar = await createCAR(car);
      if (newCar) {
        await logAuditEvent(newCar.id, userName || 'IQA User', userRole, AuditAction.CAR_CREATED);
      }
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
      if (field === 'dateIssued') {
        updated.dueDate = addDays(value, 5);
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleNCUpdate = (field: 'statement' | 'evidence' | 'reference', value: string) => {
    setCar(prev => prev ? ({ ...prev, description: { ...prev.description, [field]: value } }) : null);
     if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleRCASave = (data: RCAData) => {
    // 5 Whys Principle Implementation: 
    // "Not every entry is a root cause." 
    // We must extract only the FINAL 'Why' from each chain to use as the Root Cause.
    
    let newRootCauses: RootCause[] = [];
    
    if (data.chains && data.chains.length > 0) {
       newRootCauses = data.chains.map(chain => {
          // Filter out empty entries
          const validWhys = chain.whys.filter(w => w && w.trim().length > 0);
          
          if (validWhys.length > 0) {
             // The last one is the Root Cause
             const lastWhy = validWhys[validWhys.length - 1];
             return {
                id: chain.id,
                cause: lastWhy
             };
          }
          return null;
       }).filter((item): item is RootCause => item !== null);
    }
    
    // If we have a summary hypothesis, we can append it or just use it as the summary field.
    // The previous logic allowed replacing everything with hypothesis. 
    // Let's ensure if chains exist, we use them, but if user only used AI hypothesis without chains (edge case), we use that.
    if (newRootCauses.length === 0 && data.rootCauseHypothesis && data.rootCauseHypothesis.trim()) {
        newRootCauses = [{ id: 'hypothesis', cause: data.rootCauseHypothesis }];
    }

    setCar(prev => prev ? ({ 
      ...prev, 
      rcaData: data,
      rootCauses: newRootCauses,
      causeOfNonConformance: data.rootCauseHypothesis // Sync hypothesis text
    }) : null);
    setShowRCA(false);
    // Clear old corrective suggestions since RCA changed
    setCorrectiveSuggestions([]);
  };

  const addRemedial = () => {
    if (!newRemedial.trim()) return;
    setCar(prev => prev ? ({
      ...prev,
      remedialActions: [...prev.remedialActions, { id: crypto.randomUUID(), action: newRemedial }]
    }) : null);
    setNewRemedial('');
    // Optionally remove the added suggestion from list
    setRemedialSuggestions(prev => prev.filter(s => s !== newRemedial));
  };

  const addCorrective = () => {
    if (!newCorrective.action || !newCorrective.personResponsible || !newCorrective.expectedDate) return;
    setCar(prev => prev ? ({
      ...prev,
      correctiveActions: [...prev.correctiveActions, { id: crypto.randomUUID(), ...newCorrective } as CorrectiveAction]
    }) : null);
    setNewCorrective({ personResponsible: '', expectedDate: '', action: '' });
    // Keep the assignType choice or reset it? Let's keep it.
    // Optionally remove from list
    setCorrectiveSuggestions(prev => prev.filter(s => s !== newCorrective.action));
  };

  const submitResponse = async () => {
    if (!car) return;
    if (!car.acknowledgedBy || !car.dateAcknowledged) {
        alert("Please provide the Acknowledgement details (Name and Date) before submitting your response.");
        return;
    }
    setLoading(true);
    const updatedCar = { 
      ...car, 
      status: CARStatus.RESPONDED, 
      dateResponseSubmitted: new Date().toISOString().split('T')[0] 
    };
    await updateCAR(updatedCar);
    await updateRegistryOnSubmission(car.id);
    await logAuditEvent(car.id, car.acknowledgedBy || 'Section User', Role.SECTION, AuditAction.RESPONSE_SUBMITTED);
    setLoading(false);
    navigate('/dashboard');
  };

  const reviewCAR = async (accept: boolean) => {
    if (!car) return;
    if (!accept && !qaRemarks.trim()) {
      setRemarksError(true);
      return;
    }
    setLoading(true);
    if (accept) {
      const updated = { 
        ...car, 
        status: CARStatus.ACCEPTED, 
        acceptedBy: userName || 'IQA User', 
        dateAccepted: new Date().toISOString().split('T')[0],
        returnRemarks: qaRemarks
      };
      await updateCAR(updated);
      await logAuditEvent(car.id, userName || 'IQA User', userRole, AuditAction.PLAN_ACCEPTED, { remarks: qaRemarks });
    } else {
      const revisionDue = addDays(new Date().toISOString().split('T')[0], 2);
      const updated = { 
        ...car, 
        status: CARStatus.RETURNED, 
        isReturned: true, 
        dueDate: revisionDue,
        returnRemarks: qaRemarks
      };
      await updateCAR(updated);
      await logAuditEvent(car.id, userName || 'IQA User', userRole, AuditAction.PLAN_RETURNED, { remarks: qaRemarks });
    }
    setLoading(false);
    navigate('/dashboard');
  };

  const markImplemented = async () => {
    if (!car) return;
    setLoading(true);
    const updated = {
      ...car,
      status: CARStatus.FOR_VERIFICATION
    };
    await updateCAR(updated);
    await logAuditEvent(car.id, userName || 'Section User', Role.SECTION, AuditAction.IMPLEMENTATION_COMPLETED);
    setLoading(false);
    navigate('/dashboard');
  };

  const undoImplementation = async () => {
    if (!car) return;
    if (car.status !== CARStatus.FOR_VERIFICATION) return;
    
    setLoading(true);
    const updated = {
        ...car,
        status: CARStatus.ACCEPTED // Revert to Accepted (For Implementation)
    };
    await updateCAR(updated);
    setLoading(false);
    
    // Refresh local state instead of navigating away to allow quick corrections
    setCar(updated);
  };

  const handleReissue = () => {
    if (!car) return;
    const dateIssued = new Date().toISOString().split('T')[0];
    const reIssueData: CAR = {
      id: '', 
      refNo: `${car.refNo} (Re-issue)`,
      department: car.department,
      isoClause: car.isoClause,
      carNo: `${car.carNo} (Re-issue)`,
      source: car.source,
      dateOfAudit: car.dateOfAudit,
      description: { ...car.description },
      issuedBy: userName || car.issuedBy,
      dateIssued: dateIssued,
      remedialActions: [],
      correctiveActions: [],
      rootCauses: [],
      rcaData: { chains: [], paretoItems: [] },
      status: CARStatus.OPEN,
      isLate: false,
      dueDate: addDays(dateIssued, 5)
    };
    navigate('/car/new', { state: { reIssueData } });
  };

  const verifyCAR = async (effective: boolean) => {
    if (!car) return;
    if (!effective) {
      setShowReissueModal(true);
      return;
    }
    setLoading(true);
    const updatedOldCar = {
      ...car,
      status: CARStatus.VERIFIED,
      isEffective: true,
      isCleared: true,
      verifiedBy: userName || 'IQA User',
      dateVerified: new Date().toISOString().split('T')[0]
    };
    await updateCAR(updatedOldCar);
    await logAuditEvent(car.id, userName || 'IQA User', userRole, AuditAction.VERIFIED_EFFECTIVE, { followUpComment: car.followUpComment });
    setLoading(false);
    navigate('/dashboard');
  };

  const undoVerification = async () => {
    if (!car) return;
    // Reset to "For Verification" status
    setLoading(true);
    const updated = {
      ...car,
      status: CARStatus.FOR_VERIFICATION,
      isEffective: undefined, // Reset
      isCleared: undefined, // Reset
      verifiedBy: undefined, // Reset
      dateVerified: undefined // Reset
    };
    await updateCAR(updated);
    // NO LOGGING as requested
    setLoading(false);
    setCar(updated as any);
  };

  const confirmReissue = async (shouldReissue: boolean) => {
    if (!car) return;
    setLoading(true);
    const updatedOldCar = {
      ...car,
      status: CARStatus.INEFFECTIVE,
      isEffective: false,
      isCleared: false,
      verifiedBy: userName || 'IQA User',
      dateVerified: new Date().toISOString().split('T')[0]
    };
    await updateCAR(updatedOldCar);
    await logAuditEvent(car.id, userName || 'IQA User', userRole, AuditAction.VERIFIED_INEFFECTIVE, { followUpComment: car.followUpComment });
    setShowReissueModal(false);
    if (shouldReissue) {
       handleReissue(); 
    } else {
       setLoading(false);
       navigate('/dashboard');
    }
  };

  const validateCAR = async () => {
    if (!car) return;
    setLoading(true);
    await updateCAR({
      ...car,
      status: CARStatus.CLOSED,
      validatedBy: userName || 'DQMR',
      dateValidated: new Date().toISOString().split('T')[0]
    });
    await logAuditEvent(car.id, userName || 'DQMR', userRole, AuditAction.VALIDATED_AND_CLOSED);
    setLoading(false);
    navigate('/dashboard');
  };

  const undoValidation = async () => {
    if (!car) return;
    setLoading(true);
    const updated = {
        ...car,
        status: CARStatus.VERIFIED,
        validatedBy: undefined, // Reset
        dateValidated: undefined // Reset
    };
    await updateCAR(updated);
    setLoading(false);
    setCar(updated as any);
  };

  // Permissions Logic
  const canEditHeader = !isReadOnlyView && ((isNew && userRole === Role.QA) || (userRole === Role.QA && isEditMode));
  
  const canRespond = !isReadOnlyView && userRole === Role.SECTION && (
    car.status === CARStatus.OPEN || 
    car.status === CARStatus.RETURNED || 
    car.status === CARStatus.RESPONDED
  );
  const canReview = !isReadOnlyView && userRole === Role.QA && car.status === CARStatus.RESPONDED;
  // QA can only verify if Section has marked as implemented (FOR_VERIFICATION)
  const canVerify = !isReadOnlyView && userRole === Role.QA && car.status === CARStatus.FOR_VERIFICATION;
  const canUndoVerify = !isReadOnlyView && userRole === Role.QA && (car.status === CARStatus.VERIFIED || car.status === CARStatus.INEFFECTIVE);
  
  // Section can mark implemented if QA has accepted. QA can also do this if needed.
  const canImplement = !isReadOnlyView && (userRole === Role.SECTION || userRole === Role.QA) && car.status === CARStatus.ACCEPTED;
  // Section can undo implementation if status is FOR_VERIFICATION. QA can also do this.
  const canUndoImplement = !isReadOnlyView && (userRole === Role.SECTION || userRole === Role.QA) && car.status === CARStatus.FOR_VERIFICATION;

  const canValidate = !isReadOnlyView && userRole === Role.DQMR && (car.status === CARStatus.VERIFIED || car.status === CARStatus.INEFFECTIVE);
  const canUndoValidate = !isReadOnlyView && userRole === Role.DQMR && car.status === CARStatus.CLOSED;

  const hasRCAData = car.rcaData && (car.rcaData.chains.length > 0 || car.rcaData.paretoItems.length > 0);
  const isIsoApplicable = car.source === 'Internal Audit' || car.source === 'KPI';

  // Modern UI Input Classes
  const getInputClass = (field: string, editable: boolean) => {
    const baseClass = "w-full mt-1 p-3 border rounded-lg text-sm transition-all shadow-sm";
    
    // VISIBILITY IMPROVEMENT: 
    // If editable, use bright white bg and ring on focus.
    // If disabled, use flat gray bg and gray text to push it to background.
    if (editable) {
        const errorClass = errors[field] ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-400 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
        return `${baseClass} ${errorClass} text-gray-900 font-medium placeholder-gray-400`;
    } else {
        return `${baseClass} border-transparent bg-gray-100 text-gray-500 cursor-not-allowed`;
    }
  };
  
  const getDateInputClass = (field: string, editable: boolean) => `${getInputClass(field, editable)} ${editable ? 'cursor-pointer' : ''}`;
  
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1";
  const activeLabelClass = "block text-xs font-bold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1";
  const requiredAsterisk = <span className="text-red-500 ml-1">*</span>;

  // Helper to render label with conditional edit icon
  const FieldLabel = ({ label, editable, required }: { label: string, editable: boolean, required?: boolean }) => (
      <label className={editable ? activeLabelClass : labelClass}>
          {label} 
          {required && requiredAsterisk}
          {editable && <PenLine size={10} className="text-blue-400 ml-1" />}
      </label>
  );

  // Active Section Banner Component
  const ActiveSectionBanner = ({ title, description }: { title: string, description: string }) => (
      <div className="bg-blue-600 text-white px-6 py-3 flex items-center gap-3 animate-pulse">
          <AlertCircle size={20} className="text-yellow-300" />
          <div>
              <p className="font-bold text-sm uppercase tracking-wide">{title}</p>
              <p className="text-xs text-blue-100">{description}</p>
          </div>
      </div>
  );

  // Lifecycle Tracker Component
  const LifecycleTracker = () => {
    const stages = [
      { id: 'issued', label: 'Issued', active: true },
      { id: 'responded', label: 'Responded', active: [CARStatus.RESPONDED, CARStatus.ACCEPTED, CARStatus.FOR_VERIFICATION, CARStatus.VERIFIED, CARStatus.CLOSED, CARStatus.INEFFECTIVE].includes(car.status) },
      { id: 'reviewed', label: 'IQA Reviewed', active: [CARStatus.ACCEPTED, CARStatus.FOR_VERIFICATION, CARStatus.VERIFIED, CARStatus.CLOSED, CARStatus.INEFFECTIVE].includes(car.status) },
      { id: 'implemented', label: 'Implemented', active: [CARStatus.FOR_VERIFICATION, CARStatus.VERIFIED, CARStatus.CLOSED, CARStatus.INEFFECTIVE].includes(car.status) },
      { id: 'verified', label: 'Verified', active: [CARStatus.VERIFIED, CARStatus.CLOSED, CARStatus.INEFFECTIVE].includes(car.status) },
      { id: 'closed', label: 'Closed', active: [CARStatus.CLOSED].includes(car.status) },
    ];

    return (
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 overflow-x-auto">
         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">CAR Workflow</h3>
         <div className="flex items-center justify-between relative min-w-[500px]">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
            <div className="absolute left-0 top-1/2 w-full h-1 bg-green-100 -z-10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-green-500 transition-all duration-700 ease-out" 
                 style={{ width: `${(stages.filter(s => s.active).length - 1) / (stages.length - 1) * 100}%` }}
               ></div>
            </div>

            {stages.map((stage, idx) => (
               <div key={stage.id} className="flex flex-col items-center gap-2 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${stage.active ? 'bg-green-600 border-green-600 text-white scale-110 shadow-md' : 'bg-white border-gray-300 text-gray-300'}`}>
                     {stage.active ? <CheckCircle size={16}/> : <Circle size={12}/>}
                  </div>
                  <span className={`text-xs font-bold transition-colors whitespace-nowrap ${stage.active ? 'text-green-700' : 'text-gray-400'}`}>{stage.label}</span>
               </div>
            ))}
         </div>
      </div>
    );
  };

  const Circle = ({size}: {size: number}) => <div style={{width: size, height: size, borderRadius: '50%', backgroundColor: 'currentColor'}}></div>;

  return (
    <div className="space-y-6 pb-20 relative max-w-5xl mx-auto">
      
      {/* Re-issue Modal */}
      {showReissueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 mb-4 text-orange-600">
                 <AlertCircle size={32} />
                 <h3 className="text-2xl font-bold">Ineffective Action</h3>
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">
                 You are marking this CAR as <strong>Ineffective</strong>. Would you like to immediately issue a new Corrective Action Request (Re-issue) with the same details?
              </p>
              <div className="flex gap-4 justify-end">
                 <button 
                   onClick={() => confirmReissue(false)} 
                   className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                 >
                   No, Just Close
                 </button>
                 <button 
                   onClick={() => confirmReissue(true)} 
                   className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold flex items-center gap-2 shadow-lg shadow-orange-200 transition-all hover:scale-105"
                 >
                   <RefreshCw size={18}/> Yes, Re-issue
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ISO Guide Modal */}
      {showIsoGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
                <div className="flex items-center gap-2">
                   <BookOpen size={20} className="text-green-800"/>
                   <h3 className="font-bold text-green-800">ISO 9001:2015 Clause Reference</h3>
                </div>
                <button onClick={() => setShowIsoGuide(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20}/></button>
             </div>
             
             <div className="p-4 border-b border-gray-100 bg-white shrink-0">
                <div className="relative">
                   <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search clauses or content..." 
                     className="w-full border border-gray-300 pl-10 pr-4 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                     value={isoSearch}
                     onChange={e => setIsoSearch(e.target.value)}
                     autoFocus
                   />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar space-y-3">
                {ISO_CLAUSES.filter(c => 
                   c.code.includes(isoSearch) || 
                   c.title.toLowerCase().includes(isoSearch.toLowerCase()) || 
                   (c.content && c.content.toLowerCase().includes(isoSearch.toLowerCase()))
                ).map(c => (
                   <div key={c.code} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                      <button 
                         className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                         onClick={() => setExpandedIsoClause(expandedIsoClause === c.code ? null : c.code)}
                      >
                         <div className="flex items-center gap-3">
                            <span className="font-bold text-green-700 bg-green-100 px-2 py-1 rounded text-xs whitespace-nowrap border border-green-200">{c.code}</span>
                            <span className="text-gray-800 font-semibold text-sm">{c.title}</span>
                         </div>
                         {expandedIsoClause === c.code ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronRight size={18} className="text-gray-400"/>}
                      </button>
                      
                      {expandedIsoClause === c.code && (
                         <div className="p-4 bg-gray-50 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
                            <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-line border-l-4 border-green-300 pl-3">{c.content}</p>
                            <button 
                               onClick={() => {
                                  handleNCUpdate('reference', `ISO 9001:2015 Clause ${c.code} - ${c.title}\n\n"${c.content}"`);
                                  handleUpdate('isoClause', c.code);
                                  setShowIsoGuide(false);
                                  setIsoSearch('');
                                  setExpandedIsoClause(null);
                               }}
                               className="bg-green-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition-colors ml-auto"
                            >
                               <CheckCircle size={14}/> Use This Citation
                            </button>
                         </div>
                      )}
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
          onSave={handleRCASave} 
          onCancel={() => setShowRCA(false)}
          isReadOnly={!canRespond}
        />
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-800 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
        </button>
        <div className="space-x-3">
           {car.status === CARStatus.CLOSED && (
             <button onClick={handleDownloadPdf} disabled={isPdfLoading} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 font-semibold shadow-sm flex items-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 transition-all">
               {isPdfLoading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
               {isPdfLoading ? 'Generating...' : 'Download Official PDF'}
             </button>
           )}
           
           {(isNew || isEditMode) && !isReadOnlyView && (
             <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 font-bold shadow-md shadow-green-200 flex items-center gap-2 transition-all hover:-translate-y-0.5">
               <Save size={18} /> {isNew ? 'Issue CAR' : 'Save Changes'}
             </button>
           )}
        </div>
      </div>
      
      {/* Lifecycle Progress */}
      {!isNew && <LifecycleTracker />}

      {/* Read Only Banner */}
      {isReadOnlyView && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
           <div className="bg-blue-100 p-2 rounded-full">
              <Eye size={20} className="text-blue-600" />
           </div>
           <div>
             <span className="font-bold block">Read-Only Mode</span>
             <span className="text-sm opacity-80">You are viewing this record for monitoring purposes. Actions are disabled.</span>
           </div>
        </div>
      )}

      {/* CARD 1: Key Information (Header) */}
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canEditHeader ? 'bg-white border-blue-300 ring-2 ring-blue-100 shadow-md' : 'bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'}`}>
         {canEditHeader && <ActiveSectionBanner title="Issuance Details" description="Please complete the issuance information." />}
         
         <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
               <FileText size={18} className="text-gray-500"/> Key Information
            </h3>
            {car.isLate && <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200 flex items-center gap-1"><Clock size={12}/> Overdue</span>}
         </div>
         
         <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1">
               <FieldLabel label="Ref No" editable={canEditHeader} required={isNew} />
               <input disabled={!canEditHeader} value={car.refNo} onChange={(e) => handleUpdate('refNo', e.target.value)} className={getInputClass('refNo', canEditHeader)} placeholder="e.g. 2024-001" />
               {isNew && errors.refNo && <p className="text-red-500 text-xs mt-1 font-medium">{errors.refNo}</p>}
            </div>
            <div className="col-span-1">
               <FieldLabel label="Department" editable={canEditHeader} required={isNew} />
               <select 
                disabled={!canEditHeader} 
                value={car.department} 
                onChange={(e) => handleUpdate('department', e.target.value)} 
                className={getInputClass('department', canEditHeader)}
               >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
               </select>
               {isNew && errors.department && <p className="text-red-500 text-xs mt-1 font-medium">{errors.department}</p>}
            </div>
            <div className="col-span-1">
               <FieldLabel label="ISO Clause" editable={canEditHeader && isIsoApplicable} required={isNew && isIsoApplicable} />
               <input 
                  disabled={!canEditHeader || !isIsoApplicable} 
                  value={car.isoClause} 
                  onChange={(e) => handleUpdate('isoClause', e.target.value)} 
                  className={getInputClass('isoClause', canEditHeader && isIsoApplicable)} 
                  placeholder={!isIsoApplicable ? "N/A" : ""}
               />
               {isNew && errors.isoClause && <p className="text-red-500 text-xs mt-1 font-medium">{errors.isoClause}</p>}
            </div>
            <div className="col-span-1">
               <FieldLabel label="CAR No" editable={canEditHeader} required={isNew} />
               <input disabled={!canEditHeader} value={car.carNo} onChange={(e) => handleUpdate('carNo', e.target.value)} className={getInputClass('carNo', canEditHeader)} />
               {isNew && errors.carNo && <p className="text-red-500 text-xs mt-1 font-medium">{errors.carNo}</p>}
            </div>
            
            <div className="col-span-2">
               <FieldLabel label="Source" editable={canEditHeader} required={isNew} />
               <div className="flex gap-2">
                  <select 
                     disabled={!canEditHeader} 
                     value={car.source} 
                     onChange={(e) => handleUpdate('source', e.target.value)} 
                     className={getInputClass('source', canEditHeader)}
                  >
                     <option value="Internal Audit">Internal Audit</option>
                     <option value="KPI">KPI</option>
                     <option value="DOH">DOH</option>
                     <option value="IPC">IPC</option>
                     <option value="PhilHealth">PhilHealth</option>
                     <option value="Incident Management System">Incident Management System</option>
                     <option value="Others">Others</option>
                  </select>
                  {car.source === 'Others' && (
                     <input 
                        disabled={!canEditHeader} 
                        value={car.otherSourceSpecify || ''} 
                        onChange={(e) => handleUpdate('otherSourceSpecify', e.target.value)} 
                        className={getInputClass('otherSourceSpecify', canEditHeader)}
                        placeholder="Specify source..."
                     />
                  )}
               </div>
               {isNew && errors.source && <p className="text-red-500 text-xs mt-1 font-medium">{errors.source}</p>}
            </div>
            <div className="col-span-2">
               <FieldLabel label="Date of Audit" editable={canEditHeader} required={isNew} />
               <input type="date" disabled={!canEditHeader} value={car.dateOfAudit} onChange={(e) => handleUpdate('dateOfAudit', e.target.value)} className={getDateInputClass('dateOfAudit', canEditHeader)} />
               {isNew && errors.dateOfAudit && <p className="text-red-500 text-xs mt-1 font-medium">{errors.dateOfAudit}</p>}
            </div>
         </div>
      </div>

      {/* CARD 2: Non-Conformance (IQA) */}
      <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canEditHeader ? 'bg-white border-red-300 ring-2 ring-red-100 shadow-md' : 'bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'}`}>
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
           <h3 className="font-bold text-red-900 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600"/> Problem Definition
           </h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <FieldLabel label="Problem Statement" editable={canEditHeader} required={isNew} />
            <textarea disabled={!canEditHeader} rows={2} className={getInputClass('statement', canEditHeader)} 
              value={car.description.statement} onChange={(e) => handleNCUpdate('statement', e.target.value)} placeholder="Describe what went wrong clearly..." />
            {isNew && errors.statement && <p className="text-red-500 text-xs mt-1 font-medium">{errors.statement}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <FieldLabel label="Evidence" editable={canEditHeader} required={isNew} />
               <textarea disabled={!canEditHeader} rows={6} className={getInputClass('evidence', canEditHeader)}
                  value={car.description.evidence} onChange={(e) => handleNCUpdate('evidence', e.target.value)} placeholder="Cite specific examples, dates, or records..." />
               {isNew && errors.evidence && <p className="text-red-500 text-xs mt-1 font-medium">{errors.evidence}</p>}
             </div>
             <div>
                <div className="flex items-center justify-between mb-1">
                   <FieldLabel label="Reference (Standard)" editable={canEditHeader} required={isNew} />
                   <button 
                     onClick={() => setShowIsoGuide(true)} 
                     className="text-xs font-bold text-green-700 hover:text-green-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                     disabled={!canEditHeader || !isIsoApplicable}
                   >
                     <BookOpen size={14} /> Open ISO Guide
                   </button>
                </div>
                <textarea disabled={!canEditHeader} rows={6} className={getInputClass('reference', canEditHeader)}
                   value={car.description.reference} onChange={(e) => handleNCUpdate('reference', e.target.value)} placeholder="Paste the ISO clause requirements here..." />
                {isNew && errors.reference && <p className="text-red-500 text-xs mt-1 font-medium">{errors.reference}</p>}
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
             <div>
                <FieldLabel label="Issued By" editable={canEditHeader} required={isNew} />
                <div className="relative">
                   <User size={16} className="absolute left-3 top-3.5 text-gray-400"/>
                   <input disabled={!canEditHeader} value={car.issuedBy} onChange={(e) => handleUpdate('issuedBy', e.target.value)} className={`${getInputClass('issuedBy', canEditHeader)} pl-10`} />
                </div>
                {isNew && errors.issuedBy && <p className="text-red-500 text-xs mt-1 font-medium">{errors.issuedBy}</p>}
             </div>
             <div>
                <FieldLabel label="Date Issued" editable={canEditHeader} required={isNew} />
                <input type="date" 
                  disabled={!canEditHeader} 
                  value={car.dateIssued} 
                  onChange={(e) => handleUpdate('dateIssued', e.target.value)} 
                  className={getDateInputClass('dateIssued', canEditHeader)} 
                />
                 {isNew && errors.dateIssued && <p className="text-red-500 text-xs mt-1 font-medium">{errors.dateIssued}</p>}
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Clock size={12}/> Target Response: {car.dueDate}</p>
             </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Response (Section User) */}
      {!isNew && (
        <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canRespond ? 'bg-white border-blue-400 ring-2 ring-blue-200 shadow-xl scale-[1.01]' : 'bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'}`}>
           {canRespond && <ActiveSectionBanner title="Action Required: Response" description="Please acknowledge, perform RCA, and provide your corrective action plan." />}
           
           <div className={`px-6 py-4 border-b flex items-center justify-between ${canRespond ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
             <h3 className={`font-bold flex items-center gap-2 ${canRespond ? 'text-blue-900' : 'text-gray-800'}`}>
                <Activity size={18} className={canRespond ? 'text-blue-600' : 'text-gray-500'}/> Auditee Response
             </h3>
             {car.status === CARStatus.RESPONDED && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">Submitted</span>}
           </div>

           {/* Revision Alert */}
           {car.isReturned && car.status === CARStatus.RETURNED && (
             <div className="m-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <h4 className="flex items-center gap-2 text-red-800 font-bold mb-1">
                   <AlertCircle size={20}/> Revision Requested
                </h4>
                <p className="text-red-700 text-sm italic">"{car.returnRemarks || "Please revise based on discussions."}"</p>
             </div>
           )}

           <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div>
                   <FieldLabel label="Acknowledged By" editable={canRespond} required />
                   <input disabled={!canRespond} value={car.acknowledgedBy || ''} onChange={(e) => handleUpdate('acknowledgedBy', e.target.value)} className={getInputClass('acknowledgedBy', canRespond)} placeholder="Name of process owner" />
                 </div>
                 <div>
                    <FieldLabel label="Date Acknowledged" editable={canRespond} required />
                    <input 
                       type="date"
                       disabled={!canRespond} 
                       value={car.dateAcknowledged || ''} 
                       onChange={(e) => handleUpdate('dateAcknowledged', e.target.value)} 
                       className={getDateInputClass('dateAcknowledged', canRespond)} 
                    />
                 </div>
              </div>

              {/* RCA Sub-Card */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 mb-8">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <label className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                          <GitBranch size={16} className="text-purple-600"/> Root Cause Analysis (RCA)
                       </label>
                       <p className="text-xs text-gray-500 mt-1">Use 4M Factor Analysis with 5 Whys to identify root causes.</p>
                    </div>
                    <button 
                      onClick={() => setShowRCA(true)}
                      className={`border border-gray-300 text-gray-700 hover:text-purple-700 hover:border-purple-300 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-2 ${canRespond || hasRCAData ? 'bg-white' : 'bg-gray-100 cursor-not-allowed opacity-70'}`}
                      disabled={!canRespond && !hasRCAData}
                    >
                      {canRespond ? (hasRCAData ? 'Edit Analysis' : 'Start Analysis') : 'View Analysis'}
                    </button>
                 </div>

                 <div className="bg-white p-4 rounded border border-gray-200">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Identified Root Causes</label>
                    {car.rootCauses && car.rootCauses.length > 0 ? (
                       <ul className="space-y-2">
                          {car.rootCauses.map((rc, idx) => (
                             <li key={rc.id} className="flex items-start gap-2 text-sm text-gray-800">
                                <span className="text-purple-600 font-bold mt-0.5">•</span>
                                {rc.cause}
                             </li>
                          ))}
                       </ul>
                    ) : (
                       <p className="text-sm text-gray-400 italic">No root causes identified yet.</p>
                    )}
                 </div>
              </div>

              {/* Remedial Actions List */}
              <div className="mb-8">
                 <FieldLabel label="Correction / Immediate Remedial Action" editable={canRespond} />
                 <ul className="space-y-2 mb-3">
                    {car.remedialActions.map(r => (
                       <li key={r.id} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded border border-gray-200 text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          <span className="flex-1">{r.action}</span>
                          {canRespond && <button onClick={() => setCar(prev => prev ? ({...prev, remedialActions: prev.remedialActions.filter(x => x.id !== r.id)}) : null)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>}
                       </li>
                    ))}
                 </ul>
                 {canRespond && (
                    <>
                      <div className="flex gap-2">
                         <input className="flex-1 p-2 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-green-500 outline-none" placeholder="Add immediate remedial action..." value={newRemedial} onChange={e => setNewRemedial(e.target.value)} />
                         <button onClick={addRemedial} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-sm flex items-center justify-center"><Plus size={18}/></button>
                      </div>
                      
                      {/* AI Suggestions for Remedial */}
                      <div className="mt-2">
                        <button 
                          onClick={handleGenerateRemedial} 
                          disabled={isRemedialAiLoading}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRemedialAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          AI Suggest
                        </button>
                        
                        {remedialSuggestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                            {remedialSuggestions.map((s, i) => (
                              <button 
                                key={i}
                                onClick={() => setNewRemedial(s)}
                                className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded-full hover:bg-purple-100 hover:border-purple-200 transition-colors text-left"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                 )}
              </div>

              {/* Action Plan Grid */}
              <div className="mb-8">
                 <FieldLabel label="Corrective Action Plan" editable={canRespond} />
                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                          <tr>
                             <th className="p-3 border-r border-gray-200 w-1/2">Specific Action</th>
                             <th className="p-3 border-r border-gray-200">Person Responsible</th>
                             <th className="p-3 border-r border-gray-200">Target Date</th>
                             {canRespond && <th className="p-3 text-center w-12"></th>}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {car.correctiveActions.map(c => (
                             <tr key={c.id} className="bg-white">
                                <td className="p-3 border-r border-gray-100">{c.action}</td>
                                <td className="p-3 border-r border-gray-100">{c.personResponsible}</td>
                                <td className="p-3 border-r border-gray-100 font-mono text-xs">{c.expectedDate}</td>
                                {canRespond && (
                                   <td className="p-3 text-center">
                                      <button onClick={() => setCar(prev => prev ? ({...prev, correctiveActions: prev.correctiveActions.filter(x => x.id !== c.id)}) : null)} className="text-red-400 hover:text-red-600">
                                         <Trash2 size={16}/>
                                      </button>
                                   </td>
                                )}
                             </tr>
                          ))}
                          {car.correctiveActions.length === 0 && (
                             <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">No actions added yet.</td></tr>
                          )}
                       </tbody>
                    </table>
                    
                    {/* Add Action Form */}
                    {canRespond && (
                       <div className="bg-gray-50 p-3 border-t border-gray-200">
                           <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                              <div className="md:col-span-6">
                                 <input className="w-full p-2 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-green-500 outline-none" placeholder="Enter corrective action..." value={newCorrective.action || ''} onChange={e => setNewCorrective({...newCorrective, action: e.target.value})} />
                              </div>
                              <div className="md:col-span-3">
                                 {/* Assign Type Toggle */}
                                 <div className="flex gap-1 mb-1">
                                    <button 
                                       onClick={() => { setAssignType('person'); setNewCorrective({...newCorrective, personResponsible: ''}); }}
                                       className={`flex-1 text-[10px] py-0.5 rounded flex items-center justify-center gap-1 ${assignType === 'person' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-gray-200 text-gray-500'}`}
                                    >
                                       <Users size={10} /> Person
                                    </button>
                                    <button 
                                       onClick={() => { setAssignType('section'); setNewCorrective({...newCorrective, personResponsible: ''}); }}
                                       className={`flex-1 text-[10px] py-0.5 rounded flex items-center justify-center gap-1 ${assignType === 'section' ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-gray-200 text-gray-500'}`}
                                    >
                                       <Building size={10} /> Section
                                    </button>
                                 </div>
                                 
                                 {assignType === 'person' ? (
                                    <input 
                                       className="w-full p-2 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-green-500 outline-none" 
                                       placeholder="Person Responsible" 
                                       value={newCorrective.personResponsible || ''} 
                                       onChange={e => setNewCorrective({...newCorrective, personResponsible: e.target.value})} 
                                    />
                                 ) : (
                                    <select
                                       className="w-full p-2 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-green-500 outline-none" 
                                       value={newCorrective.personResponsible || ''} 
                                       onChange={e => setNewCorrective({...newCorrective, personResponsible: e.target.value})}
                                    >
                                       <option value="">Select Section...</option>
                                       {DEPARTMENTS.map(d => (
                                          <option key={d} value={d}>{d}</option>
                                       ))}
                                    </select>
                                 )}
                              </div>
                              <div className="md:col-span-2">
                                 <input type="date" className="w-full p-2 text-sm border border-gray-300 bg-white text-gray-900 rounded focus:ring-1 focus:ring-green-500 outline-none" value={newCorrective.expectedDate || ''} onChange={e => setNewCorrective({...newCorrective, expectedDate: e.target.value})} />
                              </div>
                              <div className="md:col-span-1">
                                 <button onClick={addCorrective} className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded flex justify-center items-center shadow-sm"><Plus size={18}/></button>
                              </div>
                           </div>

                           {/* AI Suggestions for Corrective */}
                           <div className="mt-3">
                              <button 
                                onClick={handleGenerateCorrective} 
                                disabled={isCorrectiveAiLoading}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isCorrectiveAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                AI Suggest from Root Causes
                              </button>
                              
                              {correctiveSuggestions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                                  {correctiveSuggestions.map((s, i) => (
                                    <button 
                                      key={i}
                                      onClick={() => setNewCorrective({...newCorrective, action: s})}
                                      className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full hover:bg-blue-100 hover:border-blue-200 transition-colors text-left"
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                           </div>
                       </div>
                    )}
                 </div>
              </div>

              {canRespond && (
                 <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <button onClick={submitResponse} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-lg shadow-blue-200 font-bold flex items-center gap-2 transition-transform hover:-translate-y-0.5">
                       <Save size={18}/> Submit Response
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* CARD 4: IQA Review (QA User) */}
      {car.status !== CARStatus.OPEN && car.status !== CARStatus.RETURNED && (
        <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canReview ? 'bg-white border-purple-400 ring-2 ring-purple-200 shadow-xl scale-[1.01]' : 'bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'}`}>
           {canReview && <ActiveSectionBanner title="Action Required: Review" description="Please review the proposed plan. Accept if valid, or Return for revision." />}
           
           <div className={`px-6 py-4 border-b flex items-center justify-between ${canReview ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`font-bold flex items-center gap-2 ${canReview ? 'text-purple-900' : 'text-gray-800'}`}>
                 <CheckCircle size={18} className={canReview ? 'text-purple-600' : 'text-gray-500'}/> IQA Review
              </h3>
           </div>
           
           <div className="p-6">
              {car.acceptedBy && (
                 <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6">
                    <CheckCircle size={24} className="text-green-600"/>
                    <div>
                       <p className="font-bold text-sm">Plan Accepted</p>
                       <p className="text-xs">By {car.acceptedBy} on {car.dateAccepted}</p>
                    </div>
                 </div>
              )}

              {canReview && (
                 <div className="space-y-4">
                    <div>
                       <FieldLabel label="IQA Remarks" editable={canReview} />
                       {remarksError && <span className="text-red-500 text-xs ml-2">(required for return)</span>}
                       <textarea 
                          className={`w-full p-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 ${remarksError ? 'border-red-500 bg-red-50 text-red-900' : 'border-gray-300 bg-white text-gray-900'}`}
                          rows={3} 
                          placeholder="Enter comments..." 
                          value={qaRemarks}
                          onChange={(e) => {
                             setQaRemarks(e.target.value);
                             if(e.target.value.trim()) setRemarksError(false);
                          }}
                       />
                    </div>
                    <div className="flex gap-4 pt-2">
                       <button onClick={() => reviewCAR(true)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold shadow hover:bg-green-700 flex justify-center items-center gap-2">
                          <CheckCircle size={18}/> Accept Response
                       </button>
                       <button onClick={() => reviewCAR(false)} className="flex-1 bg-white border border-red-200 text-red-600 py-3 rounded-lg font-bold shadow-sm hover:bg-red-50 flex justify-center items-center gap-2">
                          <XCircle size={18}/> Return for Revision
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* NEW CARD: Implementation (For Section) */}
      {(car.status === CARStatus.ACCEPTED || car.status === CARStatus.FOR_VERIFICATION || car.status === CARStatus.VERIFIED || car.status === CARStatus.CLOSED || car.status === CARStatus.INEFFECTIVE) && (
         <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canImplement ? 'bg-white border-purple-400 ring-2 ring-purple-200 shadow-xl scale-[1.01]' : 'bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'}`}>
            {canImplement && <ActiveSectionBanner title="Action Required: Implementation" description="Perform the corrective actions. Mark as Implemented when done." />}
            
            <div className={`px-6 py-4 border-b flex items-center justify-between ${canImplement ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
               <h3 className={`font-bold flex items-center gap-2 ${canImplement ? 'text-purple-900' : 'text-gray-800'}`}>
                  <PlayCircle size={18} className={canImplement ? 'text-purple-600' : 'text-gray-500'}/> Implementation Status
               </h3>
            </div>
            
            <div className="p-6">
               {car.status === CARStatus.FOR_VERIFICATION || car.status === CARStatus.VERIFIED || car.status === CARStatus.CLOSED || car.status === CARStatus.INEFFECTIVE ? (
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-lg">
                     <div className="flex items-center gap-3">
                        <CheckCircle size={24} className="text-purple-600"/>
                        <div>
                           <p className="font-bold text-sm">Implementation Completed</p>
                           <p className="text-xs">Ready for verification by IQA.</p>
                        </div>
                     </div>
                     {canUndoImplement && (
                        <button onClick={undoImplementation} className="text-xs bg-white border border-purple-300 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-100 font-semibold flex items-center gap-1 transition-colors">
                           <RotateCcw size={12} /> Undo
                        </button>
                     )}
                  </div>
               ) : (
                  <div className="space-y-4">
                     <p className="text-sm text-gray-600">
                        The corrective action plan has been accepted. Please proceed with implementation. 
                        Once all actions are completed, click the button below to notify IQA for verification.
                     </p>
                     {canImplement && (
                        <button onClick={markImplemented} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold shadow flex justify-center items-center gap-2">
                           <CheckCircle size={18}/> Mark as Implemented & Ready for Verification
                        </button>
                     )}
                  </div>
               )}
            </div>
         </div>
      )}

      {/* CARD 5: Verification & Validation */}
      {(car.status === CARStatus.FOR_VERIFICATION || car.status === CARStatus.VERIFIED || car.status === CARStatus.CLOSED || car.status === CARStatus.INEFFECTIVE) && (
        <div className={`rounded-xl border overflow-hidden transition-all duration-300 ${canVerify || canValidate ? 'bg-white border-green-400 ring-2 ring-green-200 shadow-xl scale-[1.01]' : 'bg-gray-50 border-gray-200 opacity-80 hover:opacity-100'}`}>
           {(canVerify || canValidate) && <ActiveSectionBanner title="Action Required: Finalization" description="Verify effectiveness or validate for closure." />}
           
           <div className={`px-6 py-4 border-b flex items-center justify-between ${canVerify ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <ShieldCheck size={18} className="text-gray-500"/> Verification & Closure
              </h3>
              {canUndoVerify && (
                 <button onClick={undoVerification} className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100 font-semibold flex items-center gap-1 transition-colors">
                    <RotateCcw size={12} /> Undo Verification
                 </button>
              )}
           </div>
           
           <div className="p-6 space-y-6">
              <div>
                 <FieldLabel label="Verification Comments / Evidence" editable={canVerify} />
                 <textarea disabled={!canVerify} className={getInputClass("followUpComment", canVerify)} rows={3}
                   value={car.followUpComment || ''} onChange={(e) => handleUpdate('followUpComment', e.target.value)} placeholder="Enter evidence of implementation effectiveness..." />
              </div>

              {car.verifiedBy && (
                 <div className={`p-4 rounded-lg border flex items-center gap-3 ${car.isEffective ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {car.isEffective ? <ShieldCheck size={24}/> : <AlertCircle size={24}/>}
                    <div>
                       <p className="font-bold text-sm">Verification Result: {car.isEffective ? 'EFFECTIVE' : 'INEFFECTIVE'}</p>
                       <p className="text-xs opacity-80">Verified by {car.verifiedBy} on {car.dateVerified}</p>
                    </div>
                 </div>
              )}

              {/* Action Buttons for QA */}
              {canVerify && (
                 <div className="flex gap-4">
                    <button onClick={() => verifyCAR(true)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold shadow hover:bg-green-700 flex justify-center items-center gap-2">
                       <ShieldCheck size={18}/> Mark Implemented and Effective
                    </button>
                    <button onClick={() => verifyCAR(false)} className="flex-1 bg-white border border-orange-200 text-orange-600 py-3 rounded-lg font-bold shadow-sm hover:bg-orange-50 flex justify-center items-center gap-2">
                       <RefreshCw size={18}/> Mark Ineffective
                    </button>
                 </div>
              )}

              {/* Re-issue Prompt */}
              {car.status === CARStatus.INEFFECTIVE && userRole === Role.QA && !isReadOnlyView && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-center justify-between">
                     <span className="text-orange-800 text-sm font-medium">This CAR was ineffective. A new one should be issued.</span>
                     <button onClick={handleReissue} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-orange-700 flex items-center gap-2">
                        <RefreshCw size={16}/> Issue New CAR
                     </button>
                  </div>
              )}

              {/* DQMR Validation Section */}
              <div className="pt-6 border-t border-gray-100">
                 <div className="flex justify-between items-center mb-2">
                    <FieldLabel label="Final Validation" editable={canValidate} />
                    {canUndoValidate && (
                       <button onClick={undoValidation} className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100 font-semibold flex items-center gap-1 transition-colors">
                          <RotateCcw size={12} /> Undo Validation
                       </button>
                    )}
                 </div>
                 {car.validatedBy ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100 w-fit">
                       <Archive size={16}/>
                       <span className="text-sm font-semibold">Validated & Closed by {car.validatedBy} on {car.dateValidated}</span>
                    </div>
                 ) : (
                    canValidate ? (
                       <button onClick={validateCAR} className="w-full bg-green-800 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-green-900 flex justify-center items-center gap-2">
                          <Archive size={18} /> Validate & Close
                       </button>
                    ) : (
                       <div className="text-gray-400 text-sm italic flex items-center gap-2"><Clock size={14}/> Pending DQMR Validation</div>
                    )
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Audit Trail */}
      {!isNew && auditTrail.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">History Log</h3>
          <div className="relative pl-8 border-l-2 border-gray-200 space-y-8 ml-4">
             {auditTrail.map((entry) => {
                const display = {
                   [AuditAction.CAR_CREATED]: { text: 'CAR Issued', icon: PlusCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
                   [AuditAction.RESPONSE_SUBMITTED]: { text: 'Response Submitted', icon: MessageSquare, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                   [AuditAction.PLAN_RETURNED]: { text: 'Returned for Revision', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
                   [AuditAction.PLAN_ACCEPTED]: { text: 'Plan Accepted', icon: CheckCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                   [AuditAction.IMPLEMENTATION_COMPLETED]: { text: 'Implementation Done', icon: PlayCircle, color: 'text-purple-500', bg: 'bg-purple-50' },
                   [AuditAction.IMPLEMENTATION_REVOKED]: { text: 'Implementation Undone', icon: RotateCcw, color: 'text-orange-500', bg: 'bg-orange-50' },
                   [AuditAction.VERIFIED_EFFECTIVE]: { text: 'Verified Effective', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-50' },
                   [AuditAction.VERIFIED_INEFFECTIVE]: { text: 'Verified Ineffective', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
                   [AuditAction.VALIDATED_AND_CLOSED]: { text: 'Closed', icon: Archive, color: 'text-green-500', bg: 'bg-green-50' },
                   [AuditAction.CAR_DELETED]: { text: 'Deleted', icon: Trash2, color: 'text-gray-500', bg: 'bg-gray-50' },
                }[entry.action] || { text: entry.action, icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-50' };
                
                const Icon = display.icon;

                return (
                   <div key={entry.id} className="relative">
                      <div className={`absolute -left-[41px] top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${display.bg} ${display.color}`}>
                         <Icon size={16}/>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-800 text-sm">{display.text}</span>
                            <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</span>
                         </div>
                         <div className="text-xs text-gray-500">
                            by <span className="font-semibold text-gray-700">{entry.userName}</span> ({entry.userRole})
                         </div>
                         {entry.details?.remarks && (
                            <div className="mt-2 text-xs italic text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                               "{entry.details.remarks}"
                            </div>
                         )}
                      </div>
                   </div>
                );
             })}
          </div>
        </div>
      )}

    </div>
  );
};
