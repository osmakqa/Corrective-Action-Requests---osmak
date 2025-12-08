

# User Manual: Corrective Action Request (CAR) System
**Ospital ng Makati – Quality Management System**

---

## 1. System Overview
The **Corrective Action Request (CAR) System** is a centralized web-based application designed to manage the lifecycle of non-conformities in compliance with **ISO 9001:2015 Clause 10.2**. It utilizes a modern card-based interface and consolidated database architecture to track:
- Audit Findings & Non-Conformities
- Root Cause Analysis (5 Whys / Fishbone / Pareto)
- Corrective Action Planning & Deadlines
- Verification of Effectiveness (including Re-issue logic)
- Automatic Logging of Non-Submissions
- Official PDF Record Generation

---

## 2. Access & Login

### 2.1 Accessing the System
1. Open your web browser (Chrome, Edge, or Firefox).
2. Navigate to the system URL provided by the IT Department.
3. **Note:** A digital copy of this User Manual can be accessed directly from the login screen by clicking the **"User Manual"** link at the bottom of the login card.

### 2.2 Logging In
The login screen is divided into three roles. Select the tab appropriate for your position:

#### A. Process Owner (Auditee)
*For departments responding to findings.*
1. Click **Process Owner**.
2. Select your **Department** from the dropdown list.
3. Enter Password: *Please see Quality Assurance Division*.
4. Click **Login**.

#### B. IQA Admin (Auditor/IQA)
*For Internal Quality Assurance staff issuing and verifying CARs.*
1. Click **IQA**.
2. Select your **Name** from the list.
3. Enter Password: *Please see Quality Assurance Division*.
4. Click **Login**.

#### C. DQMR (Validator)
*For final validation.*
1. Click **DQMR**.
2. Enter Password: *Please see Quality Assurance Division*.
3. Click **Login**.

---

## 3. Workflow Guide

### Phase 1: Issuance (IQA Role)
1. Navigate to **Issue New CAR** in the sidebar.
2. Fill in the Key Information: **Ref No**, **Department**, **ISO Clause**, and **Source**.
3. Complete the **Problem Definition** card:
   * **Statement:** What went wrong?
   * **Evidence:** Specific examples/dates.
   * **Reference:** Use the **"ISO Guide"** button to search and insert the specific ISO 9001:2015 clause requirement. The "ISO Clause" field will auto-populate.
4. Click **Issue CAR**.
   * *Status becomes **OPEN**.*
   * *Deadline is automatically set to 5 days from issuance.*

### Phase 2: Response & RCA (Process Owner)
1. Login as the Process Owner.
2. In the **Dashboard**, find the CAR with status **OPEN** or **RETURNED** and click the **Eye Icon** (View).
3. Scroll to the **Auditee Response** card.
4. **Acknowledgement:** Enter your name and the date you received the notification.
5. **Root Cause Analysis (RCA):**
   * Click the **"Start Analysis"** (or Edit Analysis) button.
   * **Tab 1: 5 Whys:** Enter the chain of causes. Click "+ Add Next Why" to go deeper. Add multiple chains if necessary.
   * **Tab 2: Fishbone:** View the generated diagram based on your chains.
   * **Tab 3: Pareto:** Assign frequency numbers to your root causes to identify the vital few.
   * Click **Save & Close**. The selected root causes will appear on the main form.
6. **Remedial Action:** Enter immediate fixes and click **Add**.
7. **Corrective Action Plan:**
   * Enter the long-term action.
   * Assign a **Person Responsible**.
   * Set a **Target Date**.
   * Click the **+** button.
8. Click **Submit Response**.
   * *Status becomes **RESPONDED**.*

### Phase 3: Review (IQA Role)
1. Login as IQA.
2. Open the **RESPONDED** CAR.
3. Review the RCA and Action Plan in the **IQA Review** card.
   * **If Acceptable:** Enter remarks (optional) and click **Accept Response**.
     * *Status becomes **ACCEPTED**.*
   * **If Insufficient:** Enter **mandatory remarks** explaining what is missing and click **Return for Revision**.
     * *Status becomes **RETURNED**.*
     * *The Process Owner has 2 days to revise.*

### Phase 4: Implementation (Process Owner/IQA)
1. Process Owner implements the plan.
2. Process Owner (or IQA) clicks **"Mark as Implemented & Ready for Verification"**.
   * *Status becomes **FOR_VERIFICATION**.*

### Phase 5: Verification (IQA Role)
*Performed after the Target Completion Date.*
1. Open the **FOR_VERIFICATION** CAR.
2. Scroll to **Verification & Closure**.
3. Enter **Verification Comments / Evidence** (evidence of implementation).
4. Select Outcome:
   * **Mark Implemented & Effective:** The problem is solved. Status becomes **VERIFIED**.
   * **Mark Ineffective:** The problem recurred.
     * The system will prompt you to **Re-issue** a new CAR.
     * Click **Yes, Re-issue** to clone details into a new form (Ref No gets a suffix).
     * The old CAR is marked **INEFFECTIVE** and closed.

### Phase 6: Validation (DQMR Role)
1. Login as DQMR.
2. The Dashboard shows "For Validation" (Verified or Ineffective CARs).
3. Open the record.
4. Click **Validate & Close**.
   * *Status becomes **CLOSED**.*

---

## 4. Special Features

### Closed CARs & PDF Export
* **IQA View:** Navigate to **Closed CARs**. You *must* select a Department from the dropdown filter to view the archive.
* **DQMR View:** Shows all closed records.
* **Download PDF:** Click the **Download Icon** in the list or the **"Download Official PDF"** button inside the form. This generates a pixel-perfect replica of the official `OsMak-IQA-FO-CAR [Rev.2]` form.

### Recent Activity (IQA Only)
* Click **Recent Activity** in the sidebar to view a global log of all actions (Created, Submitted, Accepted, Returned, Deleted) across the system.

### Non-Submission Registry
* **Automatic Tracking:** If a Process Owner fails to submit a response by the 5-day deadline, the system automatically marks the CAR as **Late** and adds an entry to the **Non-Submission Registry**.
* **Viewing:** Click **Non-Submission** in the sidebar.

### Data Analysis (Main QA Only)
* Access via **Data Analysis** in the sidebar.
* **Charts Available:**
  * Most Common ISO Non-Conformities.
  * Source Comparison (Pie Chart).
  * Monthly Trends (Heatmap).
  * Top Performing Sections.

### Monitor Mode (IQA Only)
* IQAs can view the dashboard of any department by clicking the department name under **"Hospital Sections"** in the sidebar.
* This is a **Read-Only** view.

---

## 5. Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **PDF Download Freezes** | Ensure you are connected to the internet. If the issue persists, contact IT. |
| **"Closed CARs" List is Empty** | As an IQA, you must select a Department from the dropdown filter at the top of the list to load records. |
| **Cannot Submit Response** | Ensure "Acknowledged By" and "Date Acknowledged" are filled. |
| **"Return" Button Disabled** | You must enter remarks in the "IQA Remarks" box before returning a CAR. |

**System Administrator Contact:**
* IT Department / Quality Management Office
* Extension: 1234
