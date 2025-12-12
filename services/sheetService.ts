

import { CAR } from '../types';

// Explicitly using the URL provided
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbygmUwgizSYFg-DXQU_0KsxjK-CGkj0py0lKUsEd-NylXV_0JTa2qdFWSg_NpBfXX5H/exec';

export const backupToSheet = async (car: CAR) => {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("Google Sheets Backup URL not configured.");
    return;
  }

  // Format complex arrays into strings
  const remedialStr = (car.remedialActions || []).map(r => r.action).join('; ');
  const rootCausesStr = (car.rootCauses || []).map(r => r.cause).join('; ');
  const correctiveStr = (car.correctiveActions || []).map(c => 
    `${c.action} (By: ${c.personResponsible}, Due: ${c.expectedDate})`
  ).join('; ');

  // Map CAR object to a flat structure suitable for spreadsheet columns
  const payload = {
    id: car.id || '',
    refNo: car.refNo || '',
    department: car.department || '',
    isoClause: car.isoClause || '',
    carNo: car.carNo || '',
    source: car.source || '',
    otherSourceSpecify: car.otherSourceSpecify || '',
    dateOfAudit: car.dateOfAudit || '',
    
    // Description
    problemStatement: car.description?.statement || '',
    evidence: car.description?.evidence || '',
    reference: car.description?.reference || '',
    
    // Issuance
    issuedBy: car.issuedBy || '',
    dateIssued: car.dateIssued || '',
    dueDate: car.dueDate || '',
    isLate: car.isLate ? 'YES' : 'NO',
    
    // Response
    acknowledgedBy: car.acknowledgedBy || '',
    dateAcknowledged: car.dateAcknowledged || '',
    
    // RCA
    rootCauseHypothesis: car.rcaData?.rootCauseHypothesis || car.causeOfNonConformance || '',
    identifiedRootCauses: rootCausesStr,
    
    // Actions
    remedialActions: remedialStr,
    correctiveActions: correctiveStr,
    dateResponseSubmitted: car.dateResponseSubmitted || '',
    
    // Review
    status: car.status || '',
    acceptedBy: car.acceptedBy || '',
    dateAccepted: car.dateAccepted || '',
    isReturned: car.isReturned ? 'YES' : 'NO',
    returnRemarks: car.returnRemarks || '',
    
    // Verification
    followUpComment: car.followUpComment || '',
    isEffective: car.isEffective === true ? 'YES' : (car.isEffective === false ? 'NO' : ''),
    isCleared: car.isCleared === true ? 'YES' : (car.isCleared === false ? 'NO' : ''),
    verifiedBy: car.verifiedBy || '',
    dateVerified: car.dateVerified || '',
    
    // Validation
    validatedBy: car.validatedBy || '',
    dateValidated: car.dateValidated || '',
    
    lastUpdated: new Date().toISOString()
  };

  try {
    // 'no-cors' mode is required for Google Apps Script Web Apps to accept requests 
    // from a browser without CORS errors.
    // Note: In no-cors mode, we cannot send 'application/json' header. 
    // We send 'text/plain', but the body is still JSON stringified. 
    // Google Apps Script will parse it via JSON.parse(e.postData.contents).
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });
    console.log(`Backup signal sent to Google Sheets for CAR ${car.refNo}`);
  } catch (error) {
    console.error("Google Sheet Backup failed:", error);
    // We do not throw the error to prevent blocking the main app flow
  }
};