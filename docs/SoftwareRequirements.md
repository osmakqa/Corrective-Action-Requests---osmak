
# Software Requirements Specification (SRS) (ISO 9001:2015 Clause 8.3.3)

**Project:** Digital CAR System  
**Version:** 2.3  

---

## 1. Introduction
This document defines the functional and non-functional inputs required for the design and development of the Corrective Action Request System.

## 2. Functional Requirements

### 2.1 User Roles & Access
*   **Process Owner:** View assigned CARs, submit RCA (5 Whys/Fishbone/Pareto) and Action Plans.
*   **QA Admin:** Issue CARs, review responses, verify effectiveness, view global logs.
*   **DQMR:** Validate and close records (Effective/Ineffective).

### 2.2 Workflow Logic
*   **Status Progression:** `OPEN` -> `RESPONDED` -> `ACCEPTED` / `RETURNED` -> `VERIFIED` / `INEFFECTIVE` -> `CLOSED`.
*   **Re-issue Logic:** When verified Ineffective, system allows cloning data to a new CAR.
*   **Deadlines:** Auto-calculate due date (Standard: 5 working days).

### 2.3 Root Cause Analysis (RCA) Module
*   **5 Whys:** Interactive chain builder.
*   **Fishbone Diagram:** Visual representation of causes.
*   **Pareto Chart:** Frequency calculation and SVG visualization.
*   **Data Storage:** Root causes must be stored in the database for reporting.

### 2.4 Reporting & Output
*   **Official PDF:** The system must generate a pixel-perfect PDF matching `OsMak-IQA-FO-CAR [Rev.2]` using native drawing commands (jsPDF) to ensure layout fidelity and dynamic pagination.
*   **Analytics:** Real-time charts for ISO violations, Source breakdown, and Department performance.
*   **Audit Trail:** Global log of all user actions.

### 2.5 User Assistance
*   **In-App Manual:** A digital version of the User Manual must be accessible directly from the login interface to assist new users with credentials and workflow understanding.

## 3. Technical & Database Requirements
*   **Architecture:** ReactJS Frontend + Supabase Backend.
*   **Database Design:** 
    *   **Denormalized Structure:** To improve performance and simplify queries, `remedial_actions`, `corrective_actions`, `rca_chains`, and `pareto_items` are stored as **JSONB** columns within the main `cars` table.
    *   **Row Level Security (RLS):** Policies must be configured to secure data access.
*   **Assets:** Logos must be embedded as Base64 strings to prevent CORS issues during PDF generation.

## 4. Statutory & Regulatory Requirements
*   **ISO 9001:2015 Clause 10.2:** The data fields (Non-conformance statement, Evidence, Correction, Corrective Action) align with the standard.
*   **Data Integrity:** Records are protected. Deletion requires password confirmation.

---
**Verified By:** _________________________ (Project Lead)  
**Date:** _________________________
