# User Manual: Corrective Action Request (CAR) System
**Ospital ng Makati – Quality Management System**
**Document Ref: OM-QMS-CAR-UM-2025-V2**

---

## 1. System Overview
The **Corrective Action Request (CAR) System** is a world-class digital platform designed to automate and streamline the management of quality non-conformities in strict adherence to **ISO 9001:2015 Clause 10.2**.

The system facilitates the entire lifecycle of a quality finding:
- **Identification:** Capturing audit findings with objective evidence by IQA/QA auditors.
- **Analysis:** Performing deep-dive Root Cause Analysis (RCA) using 5 Whys, Fishbone, and Pareto methodologies.
- **Action:** Implementing immediate corrections and long-term corrective actions.
- **Verification:** Closing the loop through auditor verification of effectiveness.
- **Monitoring:** Automatic tracking of late responses and performance analytics.

---

## 2. Accessing the System

### 2.1 Role-Based Login
The login screen identifies three primary users:
1.  **Process Owner (Auditee):** Section Heads, Nursing Unit Heads, and Clinical Department Chairs.
    -   Select your category (General Section, Nursing Unit, or Clinical Dept).
    -   Select your specific office/unit from the dropdown.
2.  **IQA (Internal Quality Auditor):** Personnel responsible for issuing and reviewing CARs.
3.  **DQMR (Validator):** Validates and officially closes verified records.

---

## 3. Auditor's Guide: Issuing a CAR (QA/IQA Role)

### 3.1 Initiating a New Request
1.  Login using your **IQA Credentials**.
2.  Click **"Issue New CAR"** from the sidebar.
3.  **Ref No:** Enter the unique audit reference (e.g., `IQA-2025-001`).
4.  **Department:** Select the section where the non-conformity was observed.
5.  **ISO Clause:** Select the relevant standard clause. *Tip: Use the "ISO Guide" button to search and auto-cite the standard.*
6.  **Source:** Choose the origin of the finding (Internal Audit, KPI, Patient Complaint, Incident Management System, etc.).

### 3.2 Writing the Non-Conformance (NC)
A high-quality NC statement follows the **"P-E-R"** principle:
-   **Problem (Statement):** Clear description of the failure (e.g., "Temperature logs were incomplete").
-   **Evidence:** Objective facts found (e.g., "Found 3 missing entries for dates Jan 12-14 in Fridge A").
-   **Reference:** The specific requirement that was not met (e.g., "Hospital Policy Sec 4.2 requires twice-daily logging").

---

## 4. Auditee's Guide: Responding to a CAR (Process Owner)

### 4.1 Acknowledgement
Upon receiving notification, login as the **Process Owner** for your department. Open the pending CAR and fill in your name and date in the **"Acknowledged By"** field.

### 4.2 Conducting Root Cause Analysis (RCA)
Do not jump to solutions. Click **"Start Analysis"**:
-   **5 Whys:** Drill down from the symptom to the organizational root.
-   **AI Assist:** Use the **"Bot"** icon to get AI-generated suggestions for causal chains based on your problem statement.
-   **Pareto:** Quantify frequencies of different causes to identify the "Vital Few" (80/20 rule).
-   **Synthesis:** The system auto-generates a **Root Cause Hypothesis** based on your analysis to guide your action plan.

### 4.3 The Action Plan
1.  **Correction (Remedial):** Immediate action to fix the specific error found.
2.  **Corrective Action:** Systematic change to prevent it from ever happening again.
    -   *AI Tip:* Use the **"AI Assist"** button in the Action Plan section to generate evidence-based corrective actions based on your root causes.

---

## 5. Verification & Closure

### 5.1 Verification (IQA Role)
After implementation, the auditor must:
1.  Review evidence provided.
2.  **Result: Effective** -> Status moves to **VERIFIED**.
3.  **Result: Ineffective** -> System triggers a **Re-issue** workflow to clone details into a new CAR, ensuring the issue remains tracked until resolved.

### 5.2 Validation (DQMR Role)
The **DQMR** performs the final check of the verified record before officially **Closing** it.

---

## 6. Performance Analytics
The **Data Analysis** dashboard provides:
-   **Annual Trend Matrix:** Track ISO clause violations over multiple years.
-   **KPI Tracking:** Real-time visibility into Average Response Time and Effectiveness Rates.
-   **Non-Submission Registry:** Automated log of any office that fails to respond within the mandatory 5-day window.

---
*© 2025 Ospital ng Makati. Authorized for Internal Use Only.*