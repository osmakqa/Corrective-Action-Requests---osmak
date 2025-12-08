

import { createClient } from '@supabase/supabase-js';
import { CAR, CARStatus, RegistryEntry, Role, AuditAction, AuditTrailEntry, RCAChain, RootCause, ParetoItem } from '../types';

// --- Supabase Configuration ---
const supabaseUrl = 'https://mrhqjzblspjhdlisnyno.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaHFqemJsc3BqaGRsaXNueW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMTEwODAsImV4cCI6MjA3OTg4NzA4MH0.CMCn73brLmS4JQwZ5kAFTXfWLu5-4qMxg-4KZYWSIUY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- Helpers ---

// Calculate working days (simplified)
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Map DB snake_case to App camelCase for CARs
const mapCarFromDB = (dbCar: any): CAR => {
  // Extract RCA Data from separate columns
  const rcaChains: RCAChain[] = dbCar.chains || [];
  const paretoItems: ParetoItem[] = dbCar.pareto_items || [];

  // Reconstruct Root Causes:
  // 1. Try to get from the new dedicated column
  let rootCauses: RootCause[] = dbCar.root_causes || [];
  
  // 2. Fallback: If column is empty but chains exist (legacy data), calculate it
  if (rootCauses.length === 0 && rcaChains.length > 0) {
    rootCauses = rcaChains.map((chain: RCAChain) => {
      const whys = chain.whys.filter(w => w && w.trim().length > 0);
      const lastWhy = whys.length > 0 ? whys[whys.length - 1] : null;
      return lastWhy ? { id: chain.id, cause: lastWhy } : null;
    }).filter((cause): cause is RootCause => cause !== null);
  }

  return {
    id: dbCar.id,
    refNo: dbCar.ref_no,
    department: dbCar.department,
    isoClause: dbCar.iso_clause,
    carNo: dbCar.car_no,
    source: dbCar.source,
    otherSourceSpecify: dbCar.other_source_specify,
    dateOfAudit: dbCar.date_of_audit,
    description: {
      statement: dbCar.statement || '',
      evidence: dbCar.evidence || '',
      reference: dbCar.reference || ''
    },
    issuedBy: dbCar.issued_by,
    dateIssued: dbCar.date_issued,
    acknowledgedBy: dbCar.acknowledged_by,
    dateAcknowledged: dbCar.date_acknowledged,
    
    // RCA Data object constructed from separate columns
    rcaData: { 
      chains: rcaChains, 
      paretoItems: paretoItems,
      rootCauseHypothesis: dbCar.cause_of_non_conformance // Map hypothesis from DB column
    },
    
    causeOfNonConformance: dbCar.cause_of_non_conformance,
    
    // JSONB columns
    remedialActions: dbCar.remedial_actions || [],
    correctiveActions: dbCar.corrective_actions || [],
    
    // New Column
    rootCauses: rootCauses,
    
    dateResponseSubmitted: dbCar.date_response_submitted,
    acceptedBy: dbCar.accepted_by,
    dateAccepted: dbCar.date_accepted,
    isReturned: dbCar.is_returned,
    returnRemarks: dbCar.return_remarks,
    followUpComment: dbCar.follow_up_comment,
    isEffective: dbCar.is_effective,
    isCleared: dbCar.is_cleared,
    verifiedBy: dbCar.verified_by,
    dateVerified: dbCar.date_verified,
    validatedBy: dbCar.validated_by,
    dateValidated: dbCar.date_validated,
    status: dbCar.status as CARStatus,
    isLate: dbCar.is_late,
    dueDate: dbCar.due_date
  };
};

// Map App camelCase to DB snake_case for CARs
const mapCarToDB = (car: Partial<CAR>): any => ({
  ref_no: car.refNo,
  department: car.department,
  iso_clause: car.isoClause,
  car_no: car.carNo,
  source: car.source,
  other_source_specify: car.otherSourceSpecify || null,
  date_of_audit: car.dateOfAudit || null,
  statement: car.description?.statement || null,
  evidence: car.description?.evidence || null,
  reference: car.description?.reference || null,
  issued_by: car.issuedBy,
  date_issued: car.dateIssued,
  acknowledged_by: car.acknowledgedBy || null,
  date_acknowledged: car.dateAcknowledged || null,
  
  // Separate Columns for RCA
  chains: car.rcaData?.chains || [],
  pareto_items: car.rcaData?.paretoItems || [],
  
  // New Column for generated Root Causes
  root_causes: car.rootCauses || [],

  // JSONB Columns
  remedial_actions: car.remedialActions,
  corrective_actions: car.correctiveActions,
  
  // Save hypothesis to cause_of_non_conformance
  cause_of_non_conformance: car.rcaData?.rootCauseHypothesis || car.causeOfNonConformance || null,

  date_response_submitted: car.dateResponseSubmitted || null,
  accepted_by: car.acceptedBy || null,
  date_accepted: car.dateAccepted || null,
  is_returned: car.isReturned,
  return_remarks: car.returnRemarks || null,
  follow_up_comment: car.followUpComment || null,
  is_effective: car.isEffective,
  is_cleared: car.isCleared,
  verified_by: car.verifiedBy || null,
  date_verified: car.dateVerified || null,
  validated_by: car.validatedBy || null,
  date_validated: car.dateValidated || null,
  status: car.status,
  is_late: car.isLate,
  due_date: car.dueDate
});

const mapRegistryFromDB = (dbReg: any): RegistryEntry => ({
  id: dbReg.id,
  carId: dbReg.car_id,
  section: dbReg.section,
  requiredDocument: dbReg.required_document,
  originalDueDate: dbReg.original_due_date,
  dateReminderSent: dbReg.date_reminder_sent,
  reasonForNonSubmission: dbReg.reason_for_non_submission,
  correctiveActionForLateness: dbReg.corrective_action_for_lateness,
  dateSubmitted: dbReg.date_submitted,
  status: dbReg.status,
  dateClosed: dbReg.date_closed
});

// --- Actions ---

export const fetchCARs = async (): Promise<CAR[]> => {
  // No joins needed anymore, all data is in the 'cars' table
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching CARs:', JSON.stringify(error, null, 2));
    return [];
  }

  const cars = data.map(mapCarFromDB);

  // Check for lateness
  const today = new Date().toISOString().split('T')[0];
  const updatesToRun: Promise<any>[] = [];

  cars.forEach(car => {
    let isLate = false;
    if (car.status === CARStatus.OPEN || car.status === CARStatus.RETURNED) {
      if (car.dueDate && today > car.dueDate) {
        isLate = true;
      }
    }

    if (isLate && !car.isLate) {
      car.isLate = true;
      updatesToRun.push(updateCAR({ ...car, isLate: true }));
      updatesToRun.push(addToRegistry(car));
    }
  });

  if (updatesToRun.length > 0) {
    await Promise.all(updatesToRun);
  }

  return cars;
};

export const fetchCARById = async (id: string): Promise<CAR | null> => {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching CAR:', JSON.stringify(error, null, 2));
    return null;
  }
  
  return mapCarFromDB(data);
};

export const createCAR = async (data: Partial<CAR>): Promise<CAR | null> => {
  const dateIssued = new Date().toISOString().split('T')[0];
  const newCARPayload = {
    ...data,
    dateIssued: dateIssued,
    remedialActions: [],
    correctiveActions: [],
    rootCauses: [],
    rcaData: { chains: [], paretoItems: [] },
    status: CARStatus.OPEN,
    isLate: false,
    dueDate: addDays(dateIssued, 5)
  };

  const dbPayload = mapCarToDB(newCARPayload);

  const { data: inserted, error } = await supabase
    .from('cars')
    .insert(dbPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating CAR:', JSON.stringify(error, null, 2));
    return null;
  }
  
  return mapCarFromDB(inserted);
};

export const updateCAR = async (car: CAR): Promise<void> => {
  // Update the main CAR table - simplified single call
  const dbPayload = mapCarToDB(car);
  const { error } = await supabase
    .from('cars')
    .update(dbPayload)
    .eq('id', car.id);

  if (error) {
    console.error('Error updating CAR details:', JSON.stringify(error, null, 2));
    return;
  }
};

export const deleteCAR = async (id: string, userName: string, userRole: Role): Promise<void> => {
  await logAuditEvent(id, userName, userRole, AuditAction.CAR_DELETED);
  // Single table delete is sufficient as we've denormalized children
  const { error } = await supabase.from('cars').delete().eq('id', id);
  if (error) console.error('Error deleting CAR:', JSON.stringify(error, null, 2));
};

// --- Registry ---

export const fetchRegistry = async (): Promise<RegistryEntry[]> => {
  const { data, error } = await supabase
    .from('registry')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching registry:', JSON.stringify(error, null, 2));
    return [];
  }
  return data.map(mapRegistryFromDB);
};

export const addToRegistry = async (car: CAR) => {
  const { data } = await supabase
    .from('registry')
    .select('id')
    .eq('car_id', car.id)
    .eq('status', 'Open')
    .maybeSingle();

  if (data) return;

  const { error } = await supabase.from('registry').insert({
    car_id: car.id,
    section: car.department,
    required_document: 'CAR Response / Action Plan',
    original_due_date: car.dueDate,
    date_reminder_sent: new Date().toISOString().split('T')[0],
    status: 'Open'
  });

  if (error) console.error('Error adding to registry:', JSON.stringify(error, null, 2));
};

export const updateRegistryOnSubmission = async (carId: string) => {
  const { error } = await supabase
    .from('registry')
    .update({
      date_submitted: new Date().toISOString().split('T')[0],
      status: 'Closed',
      date_closed: new Date().toISOString().split('T')[0]
    })
    .eq('car_id', carId)
    .eq('status', 'Open');

  if (error) console.error('Error closing registry entry:', JSON.stringify(error, null, 2));
};

// --- Audit Trail ---

export const logAuditEvent = async (
  carId: string, 
  userName: string, 
  userRole: Role, 
  action: AuditAction, 
  details?: object
) => {
  const { error } = await supabase.from('audit_trail').insert({
    car_id: carId,
    user_name: userName,
    user_role: userRole,
    action: action,
    details: details
  });

  if (error) console.error('Error logging audit event:', JSON.stringify(error, null, 2));
};

export const fetchAuditTrailForCAR = async (carId: string): Promise<AuditTrailEntry[]> => {
  let { data, error } = await supabase
    .from('audit_trail')
    .select('*')
    .eq('car_id', carId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit trail:', JSON.stringify(error, null, 2));
    return [];
  }

  if (data.length === 0) {
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .select('id, issued_by, date_issued, created_at')
      .eq('id', carId)
      .single();

    if (carData && !carError) {
      const eventTimestamp = carData.date_issued 
        ? new Date(carData.date_issued).toISOString() 
        : carData.created_at;

      const { error: insertError } = await supabase.from('audit_trail').insert({
        car_id: carData.id,
        user_name: carData.issued_by || 'QA User',
        user_role: Role.QA,
        action: AuditAction.CAR_CREATED,
        created_at: eventTimestamp
      });

      if (!insertError) {
        const { data: refetchedData } = await supabase
          .from('audit_trail')
          .select('*')
          .eq('car_id', carId)
          .order('created_at', { ascending: false });
        
        if (refetchedData) {
          data = refetchedData;
        }
      }
    }
  }

  return data.map(item => ({
    id: item.id,
    createdAt: item.created_at,
    carId: item.car_id,
    userName: item.user_name,
    userRole: item.user_role as Role,
    action: item.action as AuditAction,
    details: item.details
  }));
};

export const fetchGlobalAuditTrail = async (): Promise<(AuditTrailEntry & { carRefNo?: string })[]> => {
  const { data, error } = await supabase
    .from('audit_trail')
    .select('*, cars(ref_no)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching global audit trail:', JSON.stringify(error, null, 2));
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    createdAt: item.created_at,
    carId: item.car_id,
    userName: item.user_name,
    userRole: item.user_role as Role,
    action: item.action as AuditAction,
    details: item.details,
    carRefNo: item.cars?.ref_no || 'Unknown'
  }));
};
