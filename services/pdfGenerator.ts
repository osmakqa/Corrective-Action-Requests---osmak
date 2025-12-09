

import { jsPDF } from 'jspdf';
import { CAR } from '../types';
import { LUNGSOD_NG_MAKATI_LOGO_BASE64, OSPITAL_NG_MAKATI_LOGO_BASE64 } from '../assets';

export const generateCARPdf = (car: CAR) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // --- Configuration ---
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  
  // Colors
  const headerBgColor: [number, number, number] = [255, 255, 224]; // Light yellow

  // Fonts
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // --- State Tracking ---
  let currentY = margin;

  // --- Helper Functions ---

  const checkPageBreak = (heightNeeded: number) => {
    if (currentY + heightNeeded > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  const drawHeader = () => {
    const logoSize = 22;
    
    // Left Logo
    try {
      doc.addImage(LUNGSOD_NG_MAKATI_LOGO_BASE64, 'PNG', margin, currentY, logoSize, logoSize);
    } catch (e) {
      console.warn("Left logo could not be loaded", e);
    }
    
    // Center Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('OSPITAL NG MAKATI', pageWidth / 2, currentY + 6, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Sampaguita corner Gumamela St., Pembo, Taguig City, Philippines', pageWidth / 2, currentY + 11, { align: 'center' });
    doc.text('Tel. +632 8882 6316 to 36', pageWidth / 2, currentY + 15, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PhilHealth Accredited', pageWidth / 2, currentY + 20, { align: 'center' });

    // Right Logo
    try {
      doc.addImage(OSPITAL_NG_MAKATI_LOGO_BASE64, 'PNG', pageWidth - margin - logoSize, currentY, logoSize, logoSize);
    } catch (e) {
      console.warn("Right logo could not be loaded", e);
    }

    currentY += 26;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CORRECTIVE ACTION REQUEST (CAR) [Rev. 2]', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
  };

  const drawLabel = (label: string, x: number, y: number, w: number, h: number, fill: boolean = false) => {
    if (fill) {
      doc.setFillColor(...headerBgColor);
      doc.rect(x, y, w, h, 'F');
    }
    doc.rect(x, y, w, h); // Border
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(label, x + 1, y + 4);
  };

  const drawContent = (text: string, x: number, y: number, w: number, align: 'left' | 'center' = 'left') => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (align === 'center') {
      doc.text(text || '', x + w / 2, y + 4, { align: 'center' });
    } else {
      doc.text(text || '', x + 1, y + 4);
    }
  };
  
  const sanitizeFilename = (str: string) => {
      return (str || 'CAR').replace(/[^a-z0-9-_]/gi, '-');
  };

  // --- Drawing Logic ---

  // 1. Initial Header
  drawHeader();

  // 2. Meta Data Rows
  const hRow1 = 10;
  
  // Col 1: Ref
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, 15, hRow1, 'FD');
  doc.setFont('helvetica', 'bold'); doc.text('Ref:', margin + 1, currentY + 4);
  doc.rect(margin + 15, currentY, 45, hRow1);
  doc.setFont('helvetica', 'normal'); doc.text(car.refNo || '', margin + 16, currentY + 6);

  // Col 2: Dept
  doc.rect(margin + 60, currentY, 70, hRow1);
  doc.setFont('helvetica', 'bold'); doc.text('Department/Office:', margin + 61, currentY + 4);
  doc.setFont('helvetica', 'normal'); doc.text(car.department || '', margin + 61, currentY + 8);

  // Col 3: ISO
  doc.rect(margin + 130, currentY, 30, hRow1);
  doc.setFont('helvetica', 'bold'); doc.text('ISO Clause No:', margin + 131, currentY + 4);
  doc.setFont('helvetica', 'normal'); doc.text(car.isoClause || '', margin + 131, currentY + 8);

  // Col 4: CAR No
  doc.rect(margin + 160, currentY, 26, hRow1);
  doc.setFont('helvetica', 'bold'); doc.text('CAR No:', margin + 161, currentY + 4);
  doc.setFont('helvetica', 'normal'); doc.text(car.carNo || '', margin + 161, currentY + 8);

  currentY += hRow1;

  // 3. Row 2: Source & Date
  const hRow2 = 8;
  // Source Label
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, 20, hRow2, 'FD');
  doc.setFont('helvetica', 'bold'); doc.text('SOURCE', margin + 1, currentY + 5);
  
  // Source Options
  doc.rect(margin + 20, currentY, 110, hRow2);
  const sources = ['Internal Audit', 'KPI', 'DOH', 'IPC', 'PhilHealth', 'Incident Management System', 'Others'];
  let srcX = margin + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  sources.forEach(src => {
    // Checkbox
    doc.rect(srcX, currentY + 2, 4, 4);
    if (car.source && src.toLowerCase().includes(car.source.toLowerCase())) {
      doc.text('x', srcX + 0.5, currentY + 5);
    }
    // Label
    // Shorten Incident Management System for display if needed or keep full
    const displaySrc = src === 'Incident Management System' ? 'IMS' : src;
    doc.text(displaySrc, srcX + 5, currentY + 5);
    srcX += (displaySrc.length * 1.5) + 12; // Dynamic spacing
  });

  // Date of Audit
  doc.rect(margin + 130, currentY, 56, hRow2);
  doc.setFont('helvetica', 'bold'); doc.text('Date of Audit:', margin + 131, currentY + 5);
  doc.setFont('helvetica', 'normal'); doc.text(car.dateOfAudit || '', margin + 155, currentY + 5);

  currentY += hRow2;

  // 4. DESCRIPTION OF NONCONFORMANCE
  // Header
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('DESCRIPTION OF NONCONFORMANCE:', margin + 1, currentY + 4);
  currentY += 6;

  // Content (Dynamic Height)
  const descText = `Statement: ${car.description?.statement || ''}\n\nEvidence: ${car.description?.evidence || ''}\n\nReference: ${car.description?.reference || ''}`;
  const descLines = doc.splitTextToSize(descText, contentWidth - 4);
  // Enforce minimum height of 40mm to look like the form, but grow if needed
  let descHeight = Math.max(40, descLines.length * 5 + 4);
  
  checkPageBreak(descHeight);
  doc.rect(margin, currentY, contentWidth, descHeight);
  doc.setFont('helvetica', 'normal');
  doc.text(descLines, margin + 2, currentY + 5);
  currentY += descHeight;

  // 5. Signatures (Issued By / Acknowledged By)
  const hSig = 15;
  checkPageBreak(hSig);
  
  // Box 1: Acknowledged By
  doc.rect(margin, currentY, 62, hSig);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('Acknowledged by: [Rev. 2]', margin + 1, currentY + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.acknowledgedBy || '', margin + 2, currentY + 8);
  doc.setFontSize(6);
  doc.line(margin + 2, currentY + 11, margin + 60, currentY + 11);
  doc.text('Name and Signature of Process Owner [Rev. 2]', margin + 2, currentY + 13);

  // Box 2: Issued By
  doc.rect(margin + 62, currentY, 94, hSig);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('Issued by: [Rev. 2]', margin + 63, currentY + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.issuedBy || '', margin + 64, currentY + 8);
  doc.setFontSize(6);
  doc.line(margin + 64, currentY + 11, margin + 154, currentY + 11);
  doc.text('Name and Signature of Internal Quality Auditor/Investigator [Rev. 2]', margin + 64, currentY + 13);

  // Box 3: Date Issued
  doc.rect(margin + 156, currentY, 30, hSig);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('Date issued:', margin + 157, currentY + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.dateIssued || '', margin + 157, currentY + 8);

  currentY += hSig + 2; // Add a tiny spacer

  // 6. Correction / Remedial Action
  // Header
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('CORRECTION/REMEDIAL ACTION:', margin + 1, currentY + 4);
  currentY += 6;

  // Content
  let remedialText = (car.remedialActions || []).map(r => `• ${r.action}`).join('\n');
  if (!remedialText) remedialText = " "; // Ensure at least one line
  const remedialLines = doc.splitTextToSize(remedialText, contentWidth - 4);
  let remedialHeight = Math.max(15, remedialLines.length * 5 + 4);

  checkPageBreak(remedialHeight);
  doc.rect(margin, currentY, contentWidth, remedialHeight);
  doc.setFont('helvetica', 'normal');
  doc.text(remedialLines, margin + 2, currentY + 5);
  currentY += remedialHeight + 2;

  // 7. Cause of Nonconformance
  // Header
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('CAUSE/S OF NONCONFORMANCE', margin + 1, currentY + 4);
  currentY += 6;

  // Content
  let causeText = (car.rootCauses || []).map(rc => `• ${rc.cause}`).join('\n');
  if (!causeText) causeText = " ";
  const causeLines = doc.splitTextToSize(causeText, contentWidth - 4);
  let causeHeight = Math.max(15, causeLines.length * 5 + 4);

  checkPageBreak(causeHeight);
  doc.rect(margin, currentY, contentWidth, causeHeight);
  doc.setFont('helvetica', 'normal');
  doc.text(causeLines, margin + 2, currentY + 5);
  currentY += causeHeight + 2;

  // 8. Corrective Action Table
  // Header Row
  const caCol1 = 90; // Action
  const caCol2 = 50; // Person
  const caCol3 = 46; // Date
  
  checkPageBreak(12); // Ensure header fits
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, caCol1, 10, 'FD');
  doc.rect(margin + caCol1, currentY, caCol2, 10, 'FD');
  doc.rect(margin + caCol1 + caCol2, currentY, caCol3, 10, 'FD');
  
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('CORRECTIVE ACTION:', margin + 1, currentY + 6);
  doc.text('PERSON RESPONSIBLE [Rev. 2]', margin + caCol1 + 1, currentY + 6);
  doc.text('EXPECTED DATE\nOF COMPLETION:', margin + caCol1 + caCol2 + 1, currentY + 4);
  
  currentY += 10;

  // Items
  const actions = car.correctiveActions || [];
  if (actions.length === 0) {
      // Draw one empty row if none
      const emptyH = 10;
      doc.rect(margin, currentY, caCol1, emptyH);
      doc.rect(margin + caCol1, currentY, caCol2, emptyH);
      doc.rect(margin + caCol1 + caCol2, currentY, caCol3, emptyH);
      currentY += emptyH;
  } else {
      actions.forEach(item => {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
          
          const linesAction = doc.splitTextToSize(item.action || '', caCol1 - 2);
          const linesPerson = doc.splitTextToSize(item.personResponsible || '', caCol2 - 2);
          const linesDate = doc.splitTextToSize(item.expectedDate || '', caCol3 - 2);
          
          const maxLines = Math.max(linesAction.length, linesPerson.length, linesDate.length);
          const rowHeight = Math.max(8, maxLines * 5 + 4);

          // Check Page Break inside loop
          if (currentY + rowHeight > pageHeight - margin) {
              doc.addPage();
              currentY = margin;
              // Redraw Header
              doc.setFillColor(...headerBgColor);
              doc.rect(margin, currentY, caCol1, 10, 'FD');
              doc.rect(margin + caCol1, currentY, caCol2, 10, 'FD');
              doc.rect(margin + caCol1 + caCol2, currentY, caCol3, 10, 'FD');
              
              doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
              doc.text('CORRECTIVE ACTION: (Cont.)', margin + 1, currentY + 6);
              doc.text('PERSON RESPONSIBLE', margin + caCol1 + 1, currentY + 6);
              doc.text('EXPECTED DATE', margin + caCol1 + caCol2 + 1, currentY + 6);
              currentY += 10;
          }

          doc.rect(margin, currentY, caCol1, rowHeight);
          doc.text(linesAction, margin + 1, currentY + 5);

          doc.rect(margin + caCol1, currentY, caCol2, rowHeight);
          doc.text(linesPerson, margin + caCol1 + 1, currentY + 5);

          doc.rect(margin + caCol1 + caCol2, currentY, caCol3, rowHeight);
          doc.text(linesDate, margin + caCol1 + caCol2 + 1, currentY + 5);

          currentY += rowHeight;
      });
  }
  
  // 9. Acceptance Footer
  const hAccept = 12;
  checkPageBreak(hAccept);
  
  doc.setFillColor(255, 255, 255); // Reset fill
  doc.rect(margin, currentY, 110, hAccept); // Acceptance By
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('Acceptance by: [Rev. 2]', margin + 1, currentY + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.acceptedBy || '', margin + 2, currentY + 7);
  doc.setFontSize(6);
  doc.line(margin + 2, currentY + 9, margin + 100, currentY + 9);
  doc.text('Name and Signature of Internal Quality Auditor/Investigator [Rev. 2]', margin + 2, currentY + 11);

  doc.rect(margin + 110, currentY, 76, hAccept); // Date Submitted
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('Date CAR Submitted:', margin + 111, currentY + 3);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.dateResponseSubmitted || '', margin + 111, currentY + 8);

  currentY += hAccept + 2;

  // 10. Follow-up Comment & Verification
  // Header
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('FOLLOW-UP COMMENT & VERIFICATION OF EFFECTIVENESS OF CORRECTIVE ACTION:', margin + 1, currentY + 4);
  currentY += 6;

  // Content
  let followupText = car.followUpComment || ' ';
  const followupLines = doc.splitTextToSize(followupText, contentWidth - 4);
  let followupHeight = Math.max(30, followupLines.length * 5 + 4);

  checkPageBreak(followupHeight);
  doc.rect(margin, currentY, contentWidth, followupHeight);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(followupLines, margin + 2, currentY + 5);
  currentY += followupHeight;

  // 11. Final Signatures (Cleared/Verified/Validated)
  const hFinal = 20;
  checkPageBreak(hFinal);

  // Cleared/Verified Box
  doc.rect(margin, currentY, 126, hFinal);
  
  // "Cleared: Yes [] No []"
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.setFillColor(255, 255, 255);
  // doc.rect(margin + 2, currentY + 2, 20, 6, 'F'); // Just text
  doc.text('Cleared:', margin + 2, currentY + 5);
  
  // Yes Box
  doc.rect(margin + 20, currentY + 2, 4, 4);
  doc.text('Yes', margin + 26, currentY + 5);
  if (car.isCleared === true) doc.text('X', margin + 20.5, currentY + 5);
  
  // No Box
  doc.rect(margin + 40, currentY + 2, 4, 4);
  doc.text('No', margin + 46, currentY + 5);
  if (car.isCleared === false) doc.text('X', margin + 40.5, currentY + 5);

  // Verified By Signature
  doc.text('Verified by:', margin + 2, currentY + 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.verifiedBy || '', margin + 20, currentY + 10);
  doc.line(margin + 20, currentY + 11, margin + 100, currentY + 11);
  doc.setFontSize(6);
  doc.text('Internal Quality Auditor (IQA)/Investigator [Rev. 2]', margin + 20, currentY + 14);

  // Verified Date
  doc.rect(margin + 126, currentY, 60, hFinal);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Date:', margin + 128, currentY + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.dateVerified || '', margin + 128, currentY + 10);

  currentY += hFinal;

  // Validation Box
  const hValid = 15;
  checkPageBreak(hValid);
  
  doc.rect(margin, currentY, 126, hValid);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Validated by:', margin + 2, currentY + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.validatedBy || '', margin + 22, currentY + 5);
  doc.line(margin + 22, currentY + 6, margin + 100, currentY + 6);
  doc.setFontSize(6);
  doc.text('Department Quality Management Representative (DQMR)', margin + 22, currentY + 9);

  // Validation Date
  doc.rect(margin + 126, currentY, 60, hValid);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Date:', margin + 128, currentY + 5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(car.dateValidated || '', margin + 128, currentY + 10);

  currentY += hValid + 2;

  // Footer Tag
  doc.setFont('helvetica', 'italic'); doc.setFontSize(6);
  doc.text('OsMak-IQA-FO-CAR [Rev.2]', margin, pageHeight - 5);
  doc.text(`Page 1 of 1`, pageWidth - margin - 15, pageHeight - 5);

  // Save with sanitized filename
  doc.save(`CAR-${sanitizeFilename(car.carNo || car.id)}.pdf`);
};