# User Manual: Corrective Action Request (CAR) System
**Ospital ng Makati – Quality Management System**
**Document Ref: OM-QMS-CAR-UM-2025**

---

## 1. System Overview
The **Corrective Action Request (CAR) System** is a world-class digital platform designed to automate and streamline the management of quality non-conformities in strict adherence to **ISO 9001:2015 Clause 10.2**.

The system facilitates the entire lifecycle of a quality finding:
- **Identification:** Capturing audit findings with objective evidence.
- **Analysis:** Performing deep-dive Root Cause Analysis (RCA) using 5 Whys, Fishbone, and Pareto methodologies.
- **Action:** Implementing immediate corrections and long-term corrective actions.
- **Verification:** Closing the loop through auditor verification of effectiveness.
- **Monitoring:** Automatic tracking of late responses and performance analytics.

---

## 2. Auditor's Guide: Issuing a CAR (QA/IQA Role)

### 2.1 Initiating a New Request
1.  Login using your **IQA Credentials**.
2.  Click **"Issue New CAR"** from the sidebar.
3.  **Ref No:** Enter the unique audit reference (e.g., `IQA-2025-001`).
4.  **Department:** Select the section where the non-conformity was observed.
5.  **ISO Clause:** Select the relevant standard clause. *Tip: Use the "ISO Guide" button to search and auto-cite the standard.*
6.  **Source:** Choose the origin of the finding (Internal Audit, KPI, Patient Complaint, etc.).

### 2.2 Writing the Non-Conformance (NC)
A high-quality NC statement follows the **"P-E-R"** principle:
-   **Problem (Statement):** Clear description of the failure (e.g., "Temperature logs were incomplete").
-   **Evidence:** Objective facts found (e.g., "Found 3 missing entries for dates Jan 12-14 in Fridge A").
-   **Reference:** The specific requirement that was not met (e.g., "Hospital Policy Sec 4.2 requires twice-daily logging").

### 2.3 Setting Deadlines
-   The system defaults the response deadline to **5 working days**.
-   Ensure the **"Date Issued"** is accurate, as this triggers the automated **Non-Submission Registry** if the deadline is missed.

---

## 3. Auditee's Guide: Responding to a CAR (Process Owner)

### 3.1 Acknowledgement
Upon receiving notification, login as the **Process Owner** for your department. Open the CAR and fill in your name and date in the **"Acknowledged By"** field.

### 3.2 Conducting Root Cause Analysis (RCA)
Do not jump to solutions. Click **"Start Analysis"**:
-   **5 Whys:** Drill down from the symptom to the organizational root.
-   **AI Assist:** Use the **"Bot"** icon to get AI-generated suggestions for causal chains based on your problem statement.
-   **Synthesis:** The system auto-generates a **Root Cause Hypothesis** based on your analysis.

### 3.3 The Action Plan
Distinguish between the two types of actions:
1.  **Correction (Remedial):** Immediate action to fix the specific error found (e.g., "Backfilled the log with available secondary data").
2.  **Corrective Action:** Systematic change to prevent it from ever happening again (e.g., "Installed automated digital temperature sensors with alert system").

---

## 4. Verification & Closure

### 4.1 Verification (IQA Role)
After the implementation date has passed, the auditor must:
1.  Review the evidence provided by the department.
2.  Assess if the root cause has truly been eliminated.
3.  **Result: Effective** -> CAR moves to DQMR for final validation.
4.  **Result: Ineffective** -> System triggers a **Re-issue** workflow to restart the process for that specific finding.

### 4.2 Validation (DQMR Role)
The **Department Quality Management Representative (DQMR)** performs the final check to ensure the process was followed and the documentation is complete before officially **Closing** the record.

---

## 5. Performance Analytics
The **Data Analysis** dashboard provides:
-   **ISO Trend Analysis:** Identify which clauses are most frequently violated.
-   **Departmental Comparison:** Monitor which sections have the highest volume or best response rates.
-   **Source Distribution:** See where the majority of findings originate.

---

## 6. Support & Troubleshooting
-   **Lost Password:** Contact the Quality Assurance Command Center.
-   **PDF Layout Issues:** Ensure your browser zoom is set to 100%. The system uses native `jsPDF` for pixel-perfect reproduction of official forms.
-   **Late Submissions:** Once a CAR is in the **Registry**, it must be addressed with an additional explanation for the delay.

---
*© 2025 Ospital ng Makati. Authorized for Internal Use Only.*