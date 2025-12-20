# Verification Record: Test Scripts
**Project:** Digital CAR System
**Standard:** ISO 9001:2015 Clause 8.3.4

---

## 1. Core Workflow Tests

| ID | Test Case | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| **TS-01** | **IQA Issuance** | CAR is created in `OPEN` status; Ref No is correctly generated. | PASS |
| **TS-02** | **Auditee Response** | Section user can save RCA data and actions; Status moves to `RESPONDED`. | PASS |
| **TS-03** | **IQA Review (Accept)** | Status moves to `ACCEPTED`. Auditor name is recorded. | PASS |
| **TS-04** | **IQA Review (Return)** | Status moves to `RETURNED`. Mandatory remarks are displayed to auditee. | PASS |
| **TS-05** | **Verification (Effective)** | Status moves to `VERIFIED`. Record becomes eligible for DQMR Validation. | PASS |
| **TS-06** | **Verification (Ineffective)** | "Re-issue" prompt appears; Status moves to `INEFFECTIVE`. | PASS |

## 2. Intelligence & Automation Tests

| ID | Test Case | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| **TS-07** | **AI RCA Suggestion** | Gemini returns valid causal chains based on problem statement. | PASS |
| **TS-08** | **AI Action Plan** | Gemini suggests actionable corrections based on identified root causes. | PASS |
| **TS-09** | **Registry Automation** | CARs >5 days old without response are auto-flagged in Registry. | PASS |
| **TS-10** | **PDF Data Fidelity** | Generated PDF contains all RCA and Signature data without truncation. | PASS |

## 3. Security & Integrity Tests

| ID | Test Case | Expected Result | Result |
| :--- | :--- | :--- | :--- |
| **TS-11** | **Password Delete** | System requires valid auditor password for record deletion. | PASS |
| **TS-12** | **Role-Based View** | Auditee cannot see the "Accept" or "Verify" buttons. | PASS |
| **TS-13** | **Monitor Mode** | Monitor view is strictly read-only; all save buttons are hidden. | PASS |

---
**Verification Status:** [APPROVED]
**Verified By:** QA Lead
**Date:** 2025-05-20