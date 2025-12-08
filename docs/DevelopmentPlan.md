
# Design and Development Plan (ISO 9001:2015 Clause 8.3.2)

**Project Title:** Digital Corrective Action Request (CAR) System  
**Department:** Quality Management Office / IT  
**Date Prepared:** [Insert Date]  

---

## 1. Objective
To transition from a manual paper-based CAR process to a centralized, web-based application to improve tracking, accountability, and reporting efficiency in compliance with ISO 9001:2015 Clause 10.2.

## 2. Development Stages
The project will follow a standard Software Development Life Cycle (SDLC):

### Phase 1: Planning & Requirements Gathering
*   **Input:** Review of existing "Corrective Action Request Form" and "Registry of Non-Submission."
*   **Output:** Software Requirements Specification (SRS).

### Phase 2: Design & Prototyping
*   **Activity:** Creation of modern Card-Based UI wireframes.
*   **Activity:** Database schema design (Consolidated JSONB structure in Supabase).
*   **Review:** Approval of the workflow logic by the QA Manager.

### Phase 3: Development / Coding
*   **Activity:** Frontend development using ReactJS and TailwindCSS.
*   **Activity:** Backend integration with Supabase (PostgreSQL).
*   **Key Features:** Role-based access, Advanced RCA (Fishbone/Pareto), Native PDF Generation (jsPDF).

### Phase 4: Verification (Testing)
*   **Activity:** Developer performs unit testing and integration testing.
*   **Activity:** Execution of Test Scripts (See `TestScripts.md`).

### Phase 5: Validation & Deployment
*   **Activity:** User Acceptance Testing (UAT) by select QA staff and Audit teams.
*   **Output:** UAT Sign-off and Go-Live.

## 3. Responsibilities and Authorities
*   **Project Lead / Developer:** Responsible for architecture, coding, and technical maintenance.
*   **Process Owner (QA Manager):** Responsible for defining the business rules, approval of design, and final acceptance.
*   **End Users (Process Owners):** Responsible for testing the response interface.

## 4. Resources
*   **Hardware:** Standard hospital workstations.
*   **Software:** Visual Studio Code (IDE), Supabase (Cloud Database).
*   **Libraries:** `lucide-react` (Icons), `jsPDF` (Reporting), `recharts` (Analytics).
*   **Reference Standards:** ISO 9001:2015 Standard.

## 5. Interface Control
*   The system acts as a standalone module within the QMS digital ecosystem.

---
**Prepared By:** _________________________ (Developer)  
**Approved By:** _________________________ (QA Manager)
