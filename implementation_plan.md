# WeDecide - Phase 2 Implementation Plan: Core Logic & Features

## Objective
With the foundation (Auth, DB, Environments) complete, we move to building the core value proposition: **Decision Management**. This phase focuses on the "Decision Intake" and "Management" workflows.

## 1. Decision Management (CRUD)
- [ ] **Create Decision Page** (`/decisions/new`)
    - Form with Title, Description (Rich Text optional?), and initial Status (Default: Draft).
    - Validation (Title required).
    - API connection to `decisions` table.
- [ ] **Decision Detail View** (`/decisions/:id`)
    - Header with Title, Status Badge, Owner.
    - Description view.
    - Metadata (Created At, Updated At).
    - Action Bar (Edit, Delete, Change Status).
- [ ] **Edit Decision**
    - Interface to update Title/Description.
- [ ] **Status Workflow**
    - UI to move Decision from `Draft` -> `Active` -> `Completed`.
    - Validation rules (e.g., "Cannot complete without Outcome").

## 2. Stakeholder Management
- [ ] **Manage Stakeholders UI** (Inside Decision Detail)
    - List current stakeholders.
    - **Add Stakeholder**:
        - Select from existing Organization Users.
        - (Future) Invite external users via email.
    - **Remove Stakeholder**.

## 3. Context & Documents
- [ ] **Document Attachments** (Inside Decision Detail)
    - Support for URL-based resources (Google Docs, M365, etc.).
    - Form to add: Name, URL, Type (Doc/Sheet/PDF/etc).
    - List view of attached documents with clickable links.

## 4. Dashboard Enhancements
- [ ] **Empty States**: Better guidance when no decisions exist.
- [ ] **Filtering**: Filter by Status (Active vs Completed) or My Decisions vs All Org Decisions.

## Technical Tasks (Infrastructure)
- [ ] **RLS verification**: Ensure users can only view/edit decisions within their Organization.
- [ ] **Type Safety**: Generate TypeScript types from Supabase or Prisma to ensure frontend type safety matches new schema usage.
