# Design and Development Plan
**Project:** Digital CAR System v2.6
**Ref:** ISO 9001:2015 Clause 8.3.2

---

## 1. Project Objective
To modernize the Corrective Action Request process into a unified digital experience that ensures 100% accountability and real-time visibility for the Hospital Quality Management Representative.

## 2. Development Phases & Milestones

### Phase 1: Planning & Requirements (Completed)
- **Input:** Analysis of existing manual forms and ISO 9001 requirements.
- **Milestone:** Approval of SRS and UI wireframes.

### Phase 2: Core Architecture & Database (Completed)
- **Activity:** Setup Supabase schema, RLS policies, and Auth logic.
- **Milestone:** Functional login for Sections, IQA, and DQMR.

### Phase 3: Workflow Implementation (Completed)
- **Activity:** Development of the CAR Form with conditional logic for IQA Review and Verification.
- **Milestone:** Successful "Round-trip" testing from Issuance to Closure.

### Phase 4: Intelligence & Analytics (Completed)
- **Activity:** Integration of **Gemini 3 Flash** for RCA assistance and native PDF generation.
- **Activity:** Real-time data visualization and Annual Trend Analysis Matrix.
- **Milestone:** Release of the Intelligent RCA Module and Data Dashboard.

### Phase 5: Verification & Validation (Current)
- **Activity:** System-wide testing of "Re-issue" logic and automated Non-Submission Registry.
- **Milestone:** UAT sign-off by DQMR and IQA Head.

## 3. Resource Allocation
- **Engineering:** Senior Frontend Engineer (React/TypeScript).
- **Domain Expertise:** Quality Assurance Team (IQA Lead).
- **Infrastructure:** Supabase Cloud, Google GenAI (Gemini).

## 4. Verification & Validation Controls (Clause 8.3.4)
- **Design Verification:** Peer review of the Status Transition logic in `CARForm.tsx`.
- **Design Validation:** Pilot launch across Nursing and Clinical departments to verify multi-category support.
- **Output Control:** Verification that generated PDFs match exactly the layout of approved paper forms.

---
**Prepared By:** Senior Frontend Engineer
**Authorized By:** IT Project Manager