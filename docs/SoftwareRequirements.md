# Software Requirements Specification (SRS)
**Project:** Digital Corrective Action Request (CAR) System
**Standard Alignment:** ISO 9001:2015 Clause 8.3.3

---

## 1. Purpose and Scope
The Digital CAR System is designed to provide a robust, tamper-proof environment for managing organizational non-conformities. It replaces traditional paper trails with a high-integrity digital workflow.

## 2. Functional Requirements

### 2.1 Role-Based Access Control (RBAC)
- **QA/IQA:** Create, Edit, Review, Verify, and Monitor all CARs.
- **Section/Auditee:** View assigned CARs, Submit RCA, and Implement Action Plans. Supports three sub-categories: General Sections, Nursing Units, and Clinical Departments.
- **DQMR:** Validate verified/ineffective CARs and finalize closure.
- **Security:** Password-protected deletion for QA users to maintain data integrity.

### 2.2 Corrective Action Workflow (Clause 10.2)
- **Status Engine:** Managed transitions (OPEN -> RESPONDED -> ACCEPTED -> FOR VERIFICATION -> VERIFIED -> CLOSED).
- **Automated Registry:** Daily monitoring for overdue responses (>5 working days), with automatic entry into the `registry` table.
- **Re-issue Logic:** One-click cloning of ineffective CARs to ensure persistent tracking of unresolved issues.

### 2.3 Intelligent RCA Module
- **Multi-Methodology Support:** 5 Whys (Causal chains), Fishbone (Visual), and Pareto (Statistical prioritization).
- **AI Synthesis:** Integration with **Gemini 3 Flash** to suggest remedial/corrective actions and synthesize root cause hypotheses.
- **Data-Driven Pareto:** Automatic calculation of cumulative percentages and prioritization based on user-entered frequencies.

### 2.4 Document Control (Clause 7.5)
- **PDF Generation:** Native `jsPDF` implementation to generate official hospital forms (`OsMak-IQA-FO-CAR [Rev.2]`) with support for dynamic content, headers, and digital signatures.
- **Audit Trail:** Immutable log of all "state-changing" events including timestamps, user roles, and detailed remarks.

## 3. Technical Requirements

### 3.1 Tech Stack
- **Frontend:** React 19 (Strict Mode), Tailwind CSS, Lucide Icons.
- **Backend/Database:** Supabase (PostgreSQL) using JSONB for RCA and Action Plan storage.
- **AI Integration:** `@google/genai` (Gemini 3 Flash) for intelligent analysis.
- **PDF Engine:** `jsPDF` with base64 embedded assets for high-fidelity rendering.

### 3.2 Data Integrity
- **Validation:** Strict frontend validation for "P-E-R" compliance in NC statements.
- **Concurrency:** Real-time state updates using Supabase subscriptions (where applicable).

---
**Approved By:** Quality Assurance Manager
**Date:** 2025-05-15