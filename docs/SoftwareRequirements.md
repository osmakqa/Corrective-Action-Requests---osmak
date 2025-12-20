# Software Requirements Specification (SRS)
**Project:** Digital Corrective Action Request (CAR) System
**Standard Alignment:** ISO 9001:2015 Clause 8.3.3

---

## 1. Purpose and Scope
The Digital CAR System is designed to provide a robust, tamper-proof environment for managing organizational non-conformities. It replaces traditional paper trails with a high-integrity digital workflow.

## 2. Functional Requirements

### 2.1 Role-Based Access Control (RBAC)
- **QA/IQA:** Create, Edit (until accepted), Review, Verify, and Monitor all CARs.
- **Section/Auditee:** View assigned CARs, Submit RCA, and Implement Action Plans.
- **DQMR:** Validate verified/ineffective CARs and finalize closure.
- **Security:** Password-protected deletion for QA users to maintain data integrity.

### 2.2 Corrective Action Workflow (Clause 10.2)
- **Status Engine:** Hard-coded transitions to prevent process skipping.
- **Automated Registry:** Daily background check (simulated in frontend) for overdue responses, auto-logging entries into the `registry` table.
- **Re-issue Logic:** One-click cloning of ineffective CARs to ensure persistent tracking of unresolved issues.

### 2.3 Intelligent RCA Module
- **Multi-Methodology Support:** 5 Whys (Causal chains), Fishbone (Visual), and Pareto (Statistical prioritization).
- **AI Synthesis:** Integration with Gemini API to suggest remedial/corrective actions and synthesize root cause hypotheses.
- **Visualizations:** Real-time SVG rendering of Fishbone diagrams and Pareto charts.

### 2.4 Document Control (Clause 7.5)
- **PDF Generation:** Native `jsPDF` implementation to generate official hospital forms (`OsMak-IQA-FO-CAR [Rev.2]`) with dynamic content wrapping.
- **Audit Trail:** immutable log of all "state-changing" events including who, what, and when.

## 3. Technical Requirements

### 3.1 Tech Stack
- **Frontend:** React 19 (Strict Mode), Tailwind CSS for responsive design.
- **Backend/Database:** Supabase (PostgreSQL) utilizing JSONB for flexible data structures.
- **API:** Google GenAI (Gemini) for intelligent analysis.

### 3.2 Data Design
- **Denormalization:** To optimize performance and ensure document snapshots, action plans and RCA data are stored as JSONB within the main `cars` record.
- **Integrity:** Use of UUIDs for all primary and foreign keys.

## 4. Quality & Performance Requirements
- **Responsibility:** App must be fully responsive for tablet/desktop audit use.
- **Latency:** AI suggestions should return within 3 seconds.
- **Offline Resilience:** State management must handle intermittent connectivity during audits (basic level).

---
**Approved By:** Quality Assurance Manager
**Date:** 2025-05-15