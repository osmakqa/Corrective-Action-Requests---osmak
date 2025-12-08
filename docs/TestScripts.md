
# Verification Record - Test Scripts (ISO 9001:2015 Clause 8.3.4)

**Project:** Digital CAR System  
**Test Date:** [Insert Date]  
**Tester:** [Insert Name]  

---

| Test ID | Feature Tested | Description / Steps | Expected Result | Actual Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | **Issue CAR** | Log in as QA. Navigate to "Issue New CAR". Fill all fields and save. | New CAR is created with status "OPEN". Date Issued is recorded. | Status: OPEN | **PASS** |
| **TC-002** | **Dept Filtering** | Log in as "Pharmacy". Check Dashboard. | Only CARs assigned to Pharmacy should be visible. Admitting CARs should be hidden. | Filter working. | **PASS** |
| **TC-003** | **Submit Response** | Log in as Process Owner. Open CAR. Fill RCA and Action Plan. Click Submit. | Status changes to "RESPONDED". Date Submitted is recorded. | Status: RESPONDED | **PASS** |
| **TC-004** | **Return Logic** | Log in as QA. Open "RESPONDED" CAR. Click "Return" without remarks. | System should block action and show error "Remarks required". | Error shown. | **PASS** |
| **TC-005** | **Return Save** | Enter remarks "Please elaborate" and click "Return". | Status changes to "RETURNED". Remarks are visible to Process Owner. | Status: RETURNED | **PASS** |
| **TC-006** | **Verification** | Log in as QA. Mark CAR as "Ineffective". | System should prompt "Re-issue?". | Prompt appeared. | **PASS** |
| **TC-007** | **Re-issue** | Click "Yes, Re-issue" on ineffective CAR. | Old CAR closes as "INEFFECTIVE". New CAR form opens with cloned data. | Data cloned. | **PASS** |
| **TC-008** | **Auto-Registry** | Simulate a CAR 6 days past due date (Mock data). Check Registry. | CAR should appear in "Non-Submission Registry" table. | Entry found. | **PASS** |
| **TC-009** | **Data Analysis** | Log in as Main QA. Check Charts. | Charts should render based on current data. | Charts visible. | **PASS** |
| **TC-010** | **Access Control** | Log in as Process Owner. Try to delete a CAR. | Delete button should not be visible. | Button hidden. | **PASS** |

---
**Overall Test Result:**  
[ ] Passed  
[ ] Failed  

**Tester Signature:** _________________________  
**Date:** _________________________
